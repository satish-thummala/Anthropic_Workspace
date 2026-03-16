package com.techcorp.compliance.ai.service;

import com.techcorp.compliance.ai.dto.PolicyDTOs.*;
import com.techcorp.compliance.ai.groq.client.GroqClient;
import com.techcorp.compliance.entity.Framework;
import com.techcorp.compliance.entity.Gap;
import com.techcorp.compliance.repository.FrameworkRepository;
import com.techcorp.compliance.repository.GapRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * PolicyGeneratorService
 *
 * Generates compliance policy documents using Groq LLM.
 * Falls back to richly-structured template output when Groq is unavailable.
 *
 * Supported policy types:
 *   1. access_control       — Access Control Policy
 *   2. incident_response    — Incident Response Policy
 *   3. data_protection      — Data Protection Policy
 *   4. acceptable_use       — Acceptable Use Policy
 *   5. business_continuity  — Business Continuity Policy
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PolicyGeneratorService {

    private final GroqClient          groqClient;
    private final FrameworkRepository frameworkRepo;
    private final GapRepository       gapRepo;

    // ── Public API ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PolicyGenerateResponse generate(PolicyGenerateRequest req) {
        long start = System.currentTimeMillis();

        String type          = req.getType() != null ? req.getType().toLowerCase().trim() : "";
        String frameworkCode = req.getFrameworkCode() != null ? req.getFrameworkCode().trim() : "";
        String orgName       = (req.getOrgName() != null && !req.getOrgName().isBlank())
                               ? req.getOrgName().trim() : "Your Organisation";

        PolicyTypeInfo typeInfo = resolveType(type);
        if (typeInfo == null) {
            throw new IllegalArgumentException(
                "Unknown policy type: '" + type + "'. Valid types: " +
                "access_control, incident_response, data_protection, " +
                "acceptable_use, business_continuity");
        }

        // Resolve framework name for prompts
        String frameworkName = resolveFrameworkName(frameworkCode);

        // Live gap context for this framework — helps Groq tailor the policy
        String gapContext = buildGapContext(frameworkCode);

        String content;
        String engine;

        if (groqClient.isAvailable()) {
            try {
                content = generateWithGroq(type, typeInfo, frameworkName, orgName, gapContext);
                engine  = "groq";
                log.info("Policy generated via Groq: type={} framework={}", type, frameworkCode);
            } catch (Exception e) {
                log.warn("Groq failed for policy generation, using fallback: {}", e.getMessage());
                content = generateFallback(type, typeInfo, frameworkName, orgName, gapContext);
                engine  = "local";
            }
        } else {
            content = generateFallback(type, typeInfo, frameworkName, orgName, gapContext);
            engine  = "local";
            log.debug("Groq unavailable — using local fallback for policy: {}", type);
        }

        String title = buildTitle(typeInfo.getLabel(), frameworkName, orgName);

        return PolicyGenerateResponse.builder()
                .title(title)
                .content(content)
                .policyType(type)
                .policyTypeLabel(typeInfo.getLabel())
                .framework(frameworkName)
                .orgName(orgName)
                .engine(engine)
                .durationMs(System.currentTimeMillis() - start)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    /** Returns all supported policy types with metadata. */
    public List<PolicyTypeInfo> getSupportedTypes() {
        return List.of(
            PolicyTypeInfo.builder()
                .id("access_control")
                .label("Access Control Policy")
                .description("Governs user access provisioning, authentication, least privilege, and access reviews")
                .compatibleFrameworks(List.of("ISO27001", "SOC2", "HIPAA", "GDPR"))
                .build(),
            PolicyTypeInfo.builder()
                .id("incident_response")
                .label("Incident Response Policy")
                .description("Defines procedures for detecting, reporting, containing, and recovering from security incidents")
                .compatibleFrameworks(List.of("ISO27001", "SOC2", "HIPAA"))
                .build(),
            PolicyTypeInfo.builder()
                .id("data_protection")
                .label("Data Protection Policy")
                .description("Covers data classification, handling, retention, encryption, and data subject rights")
                .compatibleFrameworks(List.of("GDPR", "HIPAA", "ISO27001", "SOC2"))
                .build(),
            PolicyTypeInfo.builder()
                .id("acceptable_use")
                .label("Acceptable Use Policy")
                .description("Sets rules for acceptable use of company IT systems, devices, networks, and data")
                .compatibleFrameworks(List.of("ISO27001", "SOC2"))
                .build(),
            PolicyTypeInfo.builder()
                .id("business_continuity")
                .label("Business Continuity Policy")
                .description("Establishes RTO/RPO targets, backup procedures, and disaster recovery planning")
                .compatibleFrameworks(List.of("ISO27001", "SOC2", "HIPAA"))
                .build()
        );
    }

    // ── Groq generation ───────────────────────────────────────────────────────

    private String generateWithGroq(String type, PolicyTypeInfo info,
                                    String frameworkName, String orgName,
                                    String gapContext) throws Exception {
        String system = buildSystemPrompt(frameworkName, orgName);
        String user   = buildUserPrompt(type, info, frameworkName, orgName, gapContext);
        return groqClient.chat(system, user, 2000, 0.3);
    }

    private String buildSystemPrompt(String frameworkName, String orgName) {
        return String.format("""
            You are a senior compliance consultant specialising in %s compliance.
            You write formal, audit-ready policy documents for %s.

            FORMAT RULES — follow exactly:
            - Use Markdown headings: # for title, ## for sections, ### for subsections
            - Use numbered lists for requirements and procedures
            - Use bullet points for supporting details
            - Every section must have substantive content — no placeholders
            - Include a document control table at the top: Version, Date, Owner, Status
            - End with a References section citing the relevant framework controls

            TONE: Professional, authoritative, specific. Avoid vague language like
            "appropriate measures" — always say what the measure actually is.
            """, frameworkName, orgName);
    }

    private String buildUserPrompt(String type, PolicyTypeInfo info,
                                   String frameworkName, String orgName,
                                   String gapContext) {
        String frameworkContext = frameworkName.equals("General")
                ? ""
                : "\n\nFramework alignment: This policy must address " + frameworkName +
                  " requirements and be auditable against its controls.";

        String gapSection = gapContext.isBlank()
                ? ""
                : "\n\nOpen compliance gaps in this framework that this policy should address:\n" + gapContext;

        return String.format("""
            Generate a complete, audit-ready %s for %s.%s%s

            The policy must include these sections:
            1. Document Control (version table)
            2. Purpose & Objectives
            3. Scope (who and what this covers)
            4. Policy Statement (the core rules — numbered, specific)
            5. Roles & Responsibilities (with named roles)
            6. Implementation Requirements (technical and procedural controls)
            7. Compliance Monitoring & Review (how compliance is measured, review frequency)
            8. Exceptions & Violations (how exceptions are handled, consequences)
            9. References (%s controls / standards)

            Make every section complete and specific. This document will be submitted
            to auditors — it must stand on its own without any further editing.
            """,
                info.getLabel(), orgName,
                frameworkContext, gapSection,
                frameworkName);
    }

    // ── Local fallback — structured template output ───────────────────────────

    private String generateFallback(String type, PolicyTypeInfo info,
                                    String frameworkName, String orgName,
                                    String gapContext) {
        return switch (type) {
            case "access_control"      -> fallbackAccessControl(frameworkName, orgName);
            case "incident_response"   -> fallbackIncidentResponse(frameworkName, orgName);
            case "data_protection"     -> fallbackDataProtection(frameworkName, orgName);
            case "acceptable_use"      -> fallbackAcceptableUse(frameworkName, orgName);
            case "business_continuity" -> fallbackBusinessContinuity(frameworkName, orgName);
            default                    -> fallbackGeneric(info.getLabel(), frameworkName, orgName);
        };
    }

    // ── Five fallback templates ───────────────────────────────────────────────

    private String fallbackAccessControl(String fw, String org) {
        String date = java.time.LocalDate.now().toString();
        return String.format("""
            # Access Control Policy

            | Field | Value |
            |-------|-------|
            | **Organisation** | %s |
            | **Version** | 1.0 |
            | **Effective Date** | %s |
            | **Owner** | Chief Information Security Officer |
            | **Status** | Active |
            | **Framework** | %s |

            ---

            ## 1. Purpose & Objectives

            This policy establishes requirements for managing access to %s information
            systems, applications, and data. The objectives are to:

            1. Ensure that access to information assets is granted only to authorised individuals
            2. Enforce the principle of least privilege across all systems
            3. Maintain an auditable record of access provisioning and revocation
            4. Reduce the risk of unauthorised access, data breaches, and insider threats

            ## 2. Scope

            This policy applies to:
            - All employees, contractors, consultants, and third-party users
            - All information systems owned or operated by %s
            - All cloud services, SaaS platforms, and hosted applications used by the organisation
            - All physical and logical access points to organisational data

            ## 3. Policy Statement

            ### 3.1 Access Provisioning
            1. Access to all systems must be formally requested and approved by the data owner or system owner
            2. Access requests must specify the minimum permissions required to perform the job function
            3. New user accounts must be provisioned within 2 business days of approved request
            4. Shared or generic accounts are prohibited except for approved service accounts

            ### 3.2 Authentication Requirements
            1. All user accounts must be protected by a unique, complex password of minimum 12 characters
            2. Multi-factor authentication (MFA) is mandatory for all privileged accounts and remote access
            3. Passwords must be changed every 90 days; password reuse of last 12 passwords is prohibited
            4. Accounts must be locked after 5 consecutive failed login attempts

            ### 3.3 Privileged Access
            1. Privileged access (admin rights) must be approved by the CISO and system owner
            2. Privileged accounts must be separate from standard user accounts
            3. All privileged access sessions must be logged and monitored
            4. Privileged access must be reviewed quarterly

            ### 3.4 Access Reviews
            1. Access rights for all users must be reviewed every 6 months
            2. Managers must certify that their team members' access remains appropriate
            3. Access for transferred employees must be reviewed within 5 business days of transfer
            4. Excessive or unused access identified in reviews must be revoked within 10 business days

            ### 3.5 Access Revocation
            1. Access for terminated employees must be revoked on or before the last day of employment
            2. Access for contractors must be revoked immediately upon contract end
            3. All credentials, tokens, and certificates must be invalidated upon revocation

            ## 4. Roles & Responsibilities

            | Role | Responsibility |
            |------|----------------|
            | CISO | Policy ownership, privileged access approval, annual review |
            | IT / IAM Team | Access provisioning, technical controls, audit logs |
            | Managers | Access request approval, periodic certification |
            | Data Owners | Approve access to their data assets |
            | All Users | Comply with this policy, report suspected violations |

            ## 5. Implementation Requirements

            ### 5.1 Technical Controls
            - Deploy an Identity and Access Management (IAM) system for centralised access control
            - Implement Role-Based Access Control (RBAC) across all enterprise systems
            - Enable Single Sign-On (SSO) with MFA for all business applications
            - Configure automatic session timeout after 15 minutes of inactivity
            - Enable and retain access logs for a minimum of 12 months

            ### 5.2 Procedural Controls
            - Maintain an access request and approval workflow with documented authorisation
            - Conduct quarterly privileged access reviews
            - Conduct bi-annual access recertification campaigns

            ## 6. Compliance Monitoring & Review

            1. Access logs must be reviewed weekly by the IT security team for anomalies
            2. This policy must be reviewed annually or following a significant security incident
            3. Compliance with this policy is assessed during internal and external audits
            4. Non-compliance metrics are reported to the CISO monthly

            ## 7. Exceptions & Violations

            - Exceptions to this policy require written approval from the CISO and must be time-limited
            - Violations are subject to disciplinary action up to and including termination
            - Security incidents resulting from policy violations must be reported to the CISO immediately

            ## 8. References

            - %s — Access Control requirements
            - ISO/IEC 27001:2022 — A.9 Access Control
            - NIST SP 800-53 — AC Access Control family
            """, org, date, fw, org, org, fw);
    }

    private String fallbackIncidentResponse(String fw, String org) {
        String date = java.time.LocalDate.now().toString();
        return String.format("""
            # Incident Response Policy

            | Field | Value |
            |-------|-------|
            | **Organisation** | %s |
            | **Version** | 1.0 |
            | **Effective Date** | %s |
            | **Owner** | Chief Information Security Officer |
            | **Status** | Active |
            | **Framework** | %s |

            ---

            ## 1. Purpose & Objectives

            This policy establishes %s's approach to managing security incidents.
            Objectives:
            1. Detect and respond to incidents rapidly to minimise business impact
            2. Preserve evidence for forensic investigation and regulatory reporting
            3. Restore normal operations in a controlled and documented manner
            4. Meet notification obligations under applicable regulations (%s)
            5. Continuously improve defences based on lessons learned

            ## 2. Scope

            Applies to all information security incidents affecting %s systems,
            data, personnel, or third-party service providers that process organisational data.

            ## 3. Incident Classification

            | Severity | Definition | Response SLA |
            |----------|------------|--------------|
            | **P1 — Critical** | Active breach, ransomware, data exfiltration | 1 hour |
            | **P2 — High** | Confirmed unauthorised access, service disruption | 4 hours |
            | **P3 — Medium** | Suspicious activity, policy violation | 24 hours |
            | **P4 — Low** | Minor policy breach, no data impact | 72 hours |

            ## 4. Incident Response Lifecycle

            ### 4.1 Preparation
            1. Maintain an Incident Response Team (IRT) with defined roles and contact details
            2. Conduct incident response tabletop exercises at least twice per year
            3. Ensure forensic tools and communication channels are available and tested

            ### 4.2 Detection & Reporting
            1. Any employee who suspects a security incident must report it immediately to security@%s
            2. Automated alerts from SIEM, IDS/IPS, or endpoint tools are triaged by the security team
            3. Initial triage must be completed within the severity SLA from first detection

            ### 4.3 Containment
            1. Isolate affected systems to prevent lateral movement while preserving evidence
            2. Revoke compromised credentials immediately
            3. Document all containment actions with timestamps

            ### 4.4 Eradication & Recovery
            1. Identify and remove the root cause before restoration
            2. Restore from clean, verified backups only
            3. Conduct post-restoration testing before returning systems to production

            ### 4.5 Notification
            1. **Regulatory**: Notify the relevant supervisory authority within 72 hours of confirmed breach (GDPR Art. 33 / HIPAA Breach Notification Rule)
            2. **Affected individuals**: Notify without undue delay when there is high risk to their rights
            3. **Executive**: CISO must notify the CEO and Board within 4 hours of a P1 incident

            ### 4.6 Post-Incident Review
            1. A written post-incident report must be completed within 5 business days
            2. Root cause analysis and corrective actions must be documented
            3. Lessons learned must be presented to the security team within 10 business days

            ## 5. Roles & Responsibilities

            | Role | Responsibility |
            |------|----------------|
            | CISO | IRT lead, executive escalation, regulatory notification |
            | Security Analyst | Detection, triage, containment, evidence collection |
            | IT Operations | System isolation, recovery, infrastructure support |
            | Legal / DPO | Regulatory notification, legal hold |
            | Communications | Internal and external communication |

            ## 6. References

            - %s incident management controls
            - ISO/IEC 27001:2022 — A.16 Information Security Incident Management
            - GDPR Article 33 — Notification of personal data breach
            """, org, date, fw, org, fw, org,
                org.toLowerCase().replaceAll("\\s+", ""), fw);
    }

    private String fallbackDataProtection(String fw, String org) {
        String date = java.time.LocalDate.now().toString();
        return String.format("""
            # Data Protection Policy

            | Field | Value |
            |-------|-------|
            | **Organisation** | %s |
            | **Version** | 1.0 |
            | **Effective Date** | %s |
            | **Owner** | Data Protection Officer |
            | **Status** | Active |
            | **Framework** | %s |

            ---

            ## 1. Purpose & Objectives

            This policy defines %s's obligations and practices for protecting personal
            and sensitive data in compliance with applicable regulations (%s).

            ## 2. Scope

            Applies to all personal data processed by %s in any form — digital,
            paper, or verbal — by employees, contractors, and data processors.

            ## 3. Data Classification

            | Class | Definition | Examples | Controls |
            |-------|------------|----------|----------|
            | **Public** | Approved for public release | Marketing materials | None required |
            | **Internal** | Business use only | Procedures, org charts | Basic access control |
            | **Confidential** | Sensitive business data | Financial data, contracts | Encryption, access control |
            | **Restricted** | Personal / regulated data | PII, health data, credentials | Encryption, MFA, audit log |

            ## 4. Data Protection Principles

            All personal data processed by %s must comply with the following principles:
            1. **Lawfulness**: Processing must have a documented legal basis
            2. **Purpose limitation**: Data collected for one purpose may not be used for another
            3. **Data minimisation**: Only collect the minimum data necessary
            4. **Accuracy**: Personal data must be kept accurate and up to date
            5. **Storage limitation**: Data must not be kept longer than necessary
            6. **Integrity & confidentiality**: Appropriate security must be applied at all times
            7. **Accountability**: %s must be able to demonstrate compliance

            ## 5. Data Subject Rights

            %s must respond to the following rights within 30 days:
            1. Right of access (provide a copy of data held)
            2. Right to rectification (correct inaccurate data)
            3. Right to erasure (delete data where no legal basis remains)
            4. Right to data portability (provide data in machine-readable format)
            5. Right to object (stop certain types of processing)

            All data subject requests must be logged and tracked by the DPO.

            ## 6. Security Requirements

            1. All Restricted and Confidential data must be encrypted at rest (AES-256) and in transit (TLS 1.2+)
            2. Personal data must not be stored on personal devices or unapproved cloud services
            3. Data processors must sign a Data Processing Agreement (DPA) before processing begins
            4. Data Protection Impact Assessments (DPIAs) are required for high-risk processing activities

            ## 7. Retention & Disposal

            1. A data retention schedule must be maintained and reviewed annually
            2. Data must be securely deleted at end of retention period
            3. Physical media must be destroyed using NIST 800-88 methods
            4. Certificates of destruction must be obtained and retained for 3 years

            ## 8. Breach Notification

            In the event of a personal data breach:
            1. Report to the DPO within 4 hours of discovery
            2. DPO assesses risk and notifies supervisory authority within 72 hours if required
            3. Affected individuals notified without undue delay if high risk to their rights

            ## 9. References

            - %s data protection controls
            - GDPR Articles 5, 6, 7, 25, 32, 33, 35
            - ISO/IEC 27001:2022 — A.18 Compliance
            """, org, date, fw, org, fw, org, org, org, fw);
    }

    private String fallbackAcceptableUse(String fw, String org) {
        String date = java.time.LocalDate.now().toString();
        return String.format("""
            # Acceptable Use Policy

            | Field | Value |
            |-------|-------|
            | **Organisation** | %s |
            | **Version** | 1.0 |
            | **Effective Date** | %s |
            | **Owner** | Chief Information Security Officer |
            | **Status** | Active |
            | **Framework** | %s |

            ---

            ## 1. Purpose & Objectives

            This policy sets rules for the acceptable use of %s information technology
            resources, protecting organisational assets and ensuring regulatory compliance.

            ## 2. Scope

            Applies to all employees, contractors, and third parties who use %s-provided
            or %s-approved IT systems, devices, networks, email, and internet access.

            ## 3. Acceptable Use Requirements

            ### 3.1 General Principles
            1. IT resources are provided for business purposes; incidental personal use is permitted provided it does not interfere with work
            2. Users must not use IT resources in a way that violates any law or regulation
            3. Users are responsible for all activity conducted under their credentials

            ### 3.2 Internet & Email
            1. Accessing, transmitting, or storing illegal, offensive, or discriminatory content is strictly prohibited
            2. Users must not click links or open attachments from unknown senders
            3. Confidential data must not be sent via personal email accounts
            4. Organisational email must not be used for commercial solicitation or mass mailings

            ### 3.3 Software & Applications
            1. Only approved software may be installed on company devices
            2. Circumventing security controls (VPN, DLP, endpoint protection) is prohibited
            3. Software licences must be respected; pirated software is prohibited
            4. Personal cloud storage (Dropbox, personal Google Drive) must not be used for work data

            ### 3.4 Devices & Remote Work
            1. Company devices must have full disk encryption enabled at all times
            2. Devices must be locked when unattended (auto-lock after 5 minutes)
            3. Lost or stolen devices must be reported to IT within 1 hour of discovery
            4. Remote access must use the approved VPN; public Wi-Fi without VPN is prohibited

            ### 3.5 Social Media
            1. Employees must not share confidential or proprietary information on social media
            2. Employees must make clear that personal views are their own and not those of %s
            3. Regulatory restrictions on information disclosure apply equally to social media

            ## 4. Prohibited Activities

            The following are strictly prohibited:
            - Accessing systems or data beyond your authorised scope
            - Attempting to bypass, disable, or interfere with security controls
            - Installing or distributing malware, spyware, or hacking tools
            - Sharing credentials with any other person
            - Cryptocurrency mining using organisational resources
            - Any activity that creates legal liability for %s

            ## 5. Monitoring

            %s reserves the right to monitor IT systems and networks for security
            and compliance purposes. Users have no expectation of privacy on company systems.

            ## 6. Violations

            Violations will result in disciplinary action up to and including termination of
            employment or contract. Criminal activity will be referred to law enforcement.

            ## 7. References

            - %s — User and endpoint security controls
            - ISO/IEC 27001:2022 — A.6.2, A.8 Asset Management
            """, org, date, fw, org, org, org, org, org, org, fw);
    }

    private String fallbackBusinessContinuity(String fw, String org) {
        String date = java.time.LocalDate.now().toString();
        return String.format("""
            # Business Continuity Policy

            | Field | Value |
            |-------|-------|
            | **Organisation** | %s |
            | **Version** | 1.0 |
            | **Effective Date** | %s |
            | **Owner** | Chief Operating Officer |
            | **Status** | Active |
            | **Framework** | %s |

            ---

            ## 1. Purpose & Objectives

            This policy ensures %s can continue critical business operations and
            recover IT services following a disruptive incident. Objectives:
            1. Define Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) for critical systems
            2. Establish backup, failover, and disaster recovery procedures
            3. Ensure regulatory and contractual continuity obligations are met (%s)
            4. Minimise financial, operational, and reputational impact of disruptions

            ## 2. Scope

            Covers all business functions, IT systems, and data classified as business-critical,
            as defined in the Business Impact Analysis (BIA).

            ## 3. Recovery Objectives

            | System Tier | Description | RTO | RPO |
            |-------------|-------------|-----|-----|
            | **Tier 1 — Critical** | Customer-facing systems, core data | 4 hours | 1 hour |
            | **Tier 2 — Important** | Internal business applications | 24 hours | 4 hours |
            | **Tier 3 — Standard** | Non-critical internal tools | 72 hours | 24 hours |

            ## 4. Backup Requirements

            1. All Tier 1 and Tier 2 data must be backed up daily with encrypted, offsite copies
            2. Backups must be stored in a geographically separate location from production
            3. Backup integrity must be verified weekly via automated checksums
            4. Full restore tests must be conducted quarterly; results documented
            5. Backup retention: Tier 1 — 90 days, Tier 2 — 30 days, Tier 3 — 14 days

            ## 5. Business Continuity Plan (BCP)

            ### 5.1 Activation Criteria
            The BCP is activated when:
            - A critical system is unavailable beyond its RTO threshold
            - A natural disaster, cyberattack, or physical event disrupts operations
            - The COO or designated alternate declares a business continuity event

            ### 5.2 Crisis Response Team
            | Role | Responsibility |
            |------|----------------|
            | COO (BCP Owner) | Declare continuity event, coordinate response |
            | CTO / IT Director | Technical recovery, system restoration |
            | CISO | Security posture during recovery |
            | Communications Lead | Internal and external communications |
            | HR Director | Staff welfare and communications |

            ### 5.3 Recovery Procedures
            1. Activate the Crisis Response Team within 30 minutes of incident declaration
            2. Assess impact and determine recovery strategy (failover, manual workaround, vendor escalation)
            3. Restore Tier 1 systems first, followed by Tier 2 and Tier 3
            4. Communicate status updates to stakeholders every 2 hours during a Tier 1 event

            ## 6. Testing & Maintenance

            1. Tabletop exercises must be conducted twice per year
            2. Full failover tests for Tier 1 systems must be conducted annually
            3. BCP documentation must be reviewed and updated at least annually
            4. All test results and identified gaps must be documented and remediated

            ## 7. References

            - %s — Business continuity and availability controls
            - ISO/IEC 27001:2022 — A.17 Business Continuity Management
            - ISO 22301 — Business Continuity Management Systems
            """, org, date, fw, org, fw, fw);
    }

    private String fallbackGeneric(String label, String fw, String org) {
        String date = java.time.LocalDate.now().toString();
        return String.format("""
            # %s

            | Field | Value |
            |-------|-------|
            | **Organisation** | %s |
            | **Version** | 1.0 |
            | **Effective Date** | %s |
            | **Framework** | %s |
            | **Status** | Draft |

            ---

            ## 1. Purpose
            This policy establishes requirements for %s at %s.

            ## 2. Scope
            Applies to all employees, contractors, and systems within %s.

            ## 3. Policy Requirements
            Requirements aligned with %s controls will be documented here.

            ## 4. Roles & Responsibilities
            Policy ownership and implementation responsibilities to be defined.

            ## 5. Review
            This policy must be reviewed annually.
            """, label, org, date, fw, label, org, org, fw);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String resolveFrameworkName(String code) {
        if (code == null || code.isBlank()) return "General";
        return frameworkRepo.findByCode(code)
                .map(Framework::getName)
                .orElse(code);
    }

    private String buildGapContext(String frameworkCode) {
        if (frameworkCode == null || frameworkCode.isBlank()) return "";
        try {
            return gapRepo.findByFrameworkCode(frameworkCode).stream()
                    .filter(g -> g.getStatus() == Gap.GapStatus.open
                              || g.getStatus() == Gap.GapStatus.in_progress)
                    .limit(8)
                    .map(g -> String.format("- [%s] %s — %s",
                            g.getSeverity().name(),
                            g.getControl().getCode(),
                            g.getControl().getTitle()))
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            log.warn("Could not load gap context for framework {}: {}", frameworkCode, e.getMessage());
            return "";
        }
    }

    private String buildTitle(String typeLabel, String frameworkName, String orgName) {
        if ("General".equals(frameworkName)) {
            return typeLabel + " — " + orgName;
        }
        return typeLabel + " — " + frameworkName + " | " + orgName;
    }

    private PolicyTypeInfo resolveType(String type) {
        return getSupportedTypes().stream()
                .filter(t -> t.getId().equals(type))
                .findFirst()
                .orElse(null);
    }
}
