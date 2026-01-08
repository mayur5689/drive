export interface User {
  id: string;
  email?: string;
  name?: string;
}

export interface File {
  id: string;
  user_id: string;
  name: string;
  path: string;
  size: number;
  mime_type: string;
  folder_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_id?: string | null;
  created_at: string;
}

export interface SharedFile {
  id: string;
  file_id: string;
  owner_id: string;
  shared_with_id: string;
  permission: 'read' | 'write';
  created_at: string;
}

export interface FileWithShared extends File {
  shared?: boolean;
  permission?: 'read' | 'write';
}


