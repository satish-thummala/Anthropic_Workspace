import React from 'react';
import { Icons } from '../../components/shared/Icons';

interface FilePreviewModalProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  onClose: () => void;
}

/**
 * FilePreviewModal
 * 
 * Displays file preview in a modal.
 * 
 * Supports:
 * - PDF: Native browser viewer
 * - Images: Direct display
 * - Word/Excel: Download with instructions
 */
export function FilePreviewModal({
  fileUrl,
  fileName,
  fileType,
  onClose,
}: FilePreviewModalProps) {
  
  const isPDF = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
  const isWord = fileType.includes('word') || /\.(doc|docx)$/i.test(fileName);
  const isExcel = fileType.includes('sheet') || fileType.includes('excel') || /\.(xls|xlsx)$/i.test(fileName);

  const downloadUrl = `${fileUrl}?download=true`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          width: '90vw',
          maxWidth: 1200,
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
              }}
            >
              <Icons.FileText />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>
                {fileName}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {isPDF && 'PDF Document'}
                {isImage && 'Image File'}
                {isWord && 'Word Document'}
                {isExcel && 'Excel Spreadsheet'}
                {!isPDF && !isImage && !isWord && !isExcel && 'Document'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={downloadUrl}
              download
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: '#f3f4f6',
                color: '#374151',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
            >
              <Icons.Download />
              Download
            </a>
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: 'none',
                background: '#f3f4f6',
                color: '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
            >
              <Icons.X />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {isPDF && (
            <iframe
              src={fileUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title="PDF Preview"
            />
          )}

          {isImage && (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f9fafb',
              }}
            >
              <img
                src={fileUrl}
                alt={fileName}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}

          {(isWord || isExcel) && (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f9fafb',
                padding: 40,
              }}
            >
              <div
                style={{
                  maxWidth: 500,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    color: '#2563eb',
                    fontSize: 32,
                  }}
                >
                  {isWord ? '📄' : '📊'}
                </div>

                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: 12,
                  }}
                >
                  {isWord ? 'Word Document' : 'Excel Spreadsheet'}
                </h3>

                <p
                  style={{
                    fontSize: 14,
                    color: '#6b7280',
                    lineHeight: 1.6,
                    marginBottom: 24,
                  }}
                >
                  Browser preview is not available for {isWord ? 'Word' : 'Excel'} files.
                  <br />
                  Download the file to view it in {isWord ? 'Microsoft Word' : 'Microsoft Excel'}.
                </p>

                <a
                  href={downloadUrl}
                  download
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 24px',
                    borderRadius: 8,
                    background: '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1d4ed8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#2563eb';
                  }}
                >
                  <Icons.Download />
                  Download File
                </a>

                <div
                  style={{
                    marginTop: 24,
                    padding: 16,
                    background: '#fef3c7',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#92400e',
                    textAlign: 'left',
                  }}
                >
                  <strong>💡 Tip:</strong> For online preview of Office documents,
                  consider using Office 365 or Google Drive integration.
                </div>
              </div>
            </div>
          )}

          {!isPDF && !isImage && !isWord && !isExcel && (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f9fafb',
              }}
            >
              <div style={{ textAlign: 'center', maxWidth: 400 }}>
                <div
                  style={{
                    fontSize: 48,
                    marginBottom: 16,
                  }}
                >
                  📎
                </div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: 12,
                  }}
                >
                  Preview Not Available
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: '#6b7280',
                    marginBottom: 24,
                  }}
                >
                  This file type cannot be previewed in the browser.
                  <br />
                  Download the file to view it.
                </p>
                <a
                  href={downloadUrl}
                  download
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 24px',
                    borderRadius: 8,
                    background: '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  <Icons.Download />
                  Download File
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
