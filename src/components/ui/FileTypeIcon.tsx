import React from 'react';
import { 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  FileArchive, 
  FileCode, 
  FileVideo, 
  FileAudio,
  File
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileTypeIconProps {
  mimeType?: string;
  fileName?: string;
  className?: string;
}

const getIcon = (mimeType?: string, fileName?: string) => {
  const ext = fileName ? fileName.split('.').pop()?.toLowerCase() : '';
  const type = mimeType?.toLowerCase() || '';

  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext!)) {
    return FileImage;
  }
  if (type === 'application/pdf' || ext === 'pdf') {
    return FileText;
  }
  if (
    type.includes('spreadsheet') || 
    type.includes('excel') || 
    type.includes('csv') || 
    ['xls', 'xlsx', 'csv'].includes(ext!)
  ) {
    return FileSpreadsheet;
  }
  if (
    type.includes('zip') || 
    type.includes('tar') || 
    type.includes('rar') || 
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext!)
  ) {
    return FileArchive;
  }
  if (
    type.includes('json') || 
    type.includes('javascript') || 
    type.includes('html') || 
    type.includes('css') || 
    ['json', 'js', 'ts', 'tsx', 'html', 'css', 'py', 'go', 'rs'].includes(ext!)
  ) {
    return FileCode;
  }
  if (type.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov'].includes(ext!)) {
    return FileVideo;
  }
  if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(ext!)) {
    return FileAudio;
  }
  
  return File;
};

export const FileTypeIcon: React.FC<FileTypeIconProps> = ({ mimeType, fileName, className }) => {
  return React.createElement(getIcon(mimeType, fileName), {
    className: cn('h-5 w-5', className)
  });
};
