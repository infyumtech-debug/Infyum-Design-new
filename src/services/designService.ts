import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  type Unsubscribe 
} from 'firebase/firestore';
import { employeeDb, isFirebaseConfigured } from './firebase';
import type { 
  DesignProject, 
  DesignFolder, 
  CarouselSlide, 
  CanvasPreset,
  ProjectCollaborator 
} from '../types/design';
import { CANVAS_PRESETS } from '../types/design';

const LOCAL_PROJECTS_KEY = 'infyum_local_projects_v2';
const LOCAL_FOLDERS_KEY = 'infyum_local_folders_v2';

// Helper to get local cache
function getLocalProjects(): Record<string, DesignProject> {
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalProjects(projects: Record<string, DesignProject>): void {
  try {
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
  } catch (err) {
    console.warn('Local storage write notice:', err);
  }
}

function getLocalFolders(): Record<string, DesignFolder> {
  try {
    const raw = localStorage.getItem(LOCAL_FOLDERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalFolders(folders: Record<string, DesignFolder>): void {
  try {
    localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify(folders));
  } catch (err) {
    console.warn('Local storage write notice:', err);
  }
}

/**
 * Creates a blank single-slide starter
 */
export function createDefaultSlide(name = 'Slide 1'): CarouselSlide {
  return {
    id: 'slide-' + Math.random().toString(36).substring(2, 9),
    name,
    background: {
      type: 'color',
      color: '#FFFFFF'
    },
    elements: []
  };
}

/**
 * Create a new design project
 */
export async function createProject(params: {
  title: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  preset?: CanvasPreset;
  width?: number;
  height?: number;
  initialSlides?: CarouselSlide[];
  folderId?: string | null;
}): Promise<DesignProject> {
  const presetKey = params.preset || 'instagram-square';
  const dimensions = CANVAS_PRESETS[presetKey];
  const width = params.width || dimensions.width;
  const height = params.height || dimensions.height;
  const now = new Date().toISOString();

  const projectId = 'proj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

  const newProject: DesignProject = {
    id: projectId,
    title: params.title.trim() || 'Untitled Design',
    ownerId: params.ownerId,
    ownerEmail: params.ownerEmail.toLowerCase(),
    ownerName: params.ownerName || 'Infyum Employee',
    folderId: params.folderId || null,
    width,
    height,
    preset: presetKey,
    slides: params.initialSlides && params.initialSlides.length > 0 
      ? params.initialSlides 
      : [createDefaultSlide()],
    activeSlideIndex: 0,
    createdAt: now,
    updatedAt: now,
    sharedWith: []
  };

  // 1. Persistent Local Cache Save
  const localMap = getLocalProjects();
  localMap[projectId] = newProject;
  saveLocalProjects(localMap);

  // 2. Firebase Cloud Firestore Save
  if (isFirebaseConfigured && employeeDb) {
    try {
      await setDoc(doc(employeeDb, 'design_projects', projectId), newProject);
    } catch (err) {
      console.warn('Firestore project create notice (local storage active):', err);
    }
  }

  return newProject;
}

/**
 * Fetches all designs belonging to this employee or shared with them
 * Strictly isolates private designs so employees only see authorized designs.
 */
export async function getUserProjects(
  userId: string, 
  userEmail: string
): Promise<DesignProject[]> {
  const normalizedEmail = (userEmail || '').trim().toLowerCase();
  const projectsMap: Record<string, DesignProject> = {};

  // 1. Load from Persistent Local Storage first
  const localMap = getLocalProjects();
  for (const proj of Object.values(localMap)) {
    const isOwner = proj.ownerId === userId || proj.ownerEmail === normalizedEmail;
    const isShared = proj.sharedWith?.some(c => c.email.toLowerCase() === normalizedEmail);
    if (isOwner || isShared) {
      projectsMap[proj.id] = proj;
    }
  }

  // 2. Query Firestore if online & configured
  if (isFirebaseConfigured && employeeDb) {
    try {
      // Query projects where user is owner
      const qOwner = query(
        collection(employeeDb, 'design_projects'),
        where('ownerId', '==', userId)
      );
      const ownerDocs = await getDocs(qOwner);
      ownerDocs.forEach(d => {
        const p = d.data() as DesignProject;
        projectsMap[p.id] = p;
      });

      // Update local storage mirror
      const updatedLocal = getLocalProjects();
      Object.assign(updatedLocal, projectsMap);
      saveLocalProjects(updatedLocal);
    } catch (err) {
      console.warn('Firestore fetch notice (serving from local cache):', err);
    }
  }

  // Sort by updatedAt descending
  return Object.values(projectsMap).sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

/**
 * Fetch a single design project by ID with authorization verification
 */
export async function getProjectById(
  projectId: string, 
  userId: string, 
  userEmail: string
): Promise<{ project: DesignProject | null; canEdit: boolean }> {
  const normalizedEmail = (userEmail || '').trim().toLowerCase();

  // Try local first
  const localMap = getLocalProjects();
  let project: DesignProject | null = localMap[projectId] || null;

  // Try Firestore if available
  if (isFirebaseConfigured && employeeDb) {
    try {
      const snap = await getDoc(doc(employeeDb, 'design_projects', projectId));
      if (snap.exists()) {
        project = snap.data() as DesignProject;
        localMap[projectId] = project;
        saveLocalProjects(localMap);
      }
    } catch (err) {
      console.warn('Firestore getDoc notice:', err);
    }
  }

  if (!project) {
    return { project: null, canEdit: false };
  }

  // Permission Check
  const isOwner = project.ownerId === userId || project.ownerEmail === normalizedEmail;
  const collaborator = project.sharedWith?.find(c => c.email.toLowerCase() === normalizedEmail);
  const isEditor = collaborator?.role === 'editor';

  if (!isOwner && !collaborator && !project.isPublic) {
    // Access Denied: User is not authorized to view this design
    return { project: null, canEdit: false };
  }

  const canEdit = isOwner || isEditor;
  return { project, canEdit };
}

/**
 * Real-time listener for active project updates (supports live collaboration)
 */
export function subscribeToProject(
  projectId: string,
  onUpdate: (project: DesignProject) => void
): Unsubscribe {
  if (isFirebaseConfigured && employeeDb) {
    try {
      return onSnapshot(doc(employeeDb, 'design_projects', projectId), (snap) => {
        if (snap.exists()) {
          const p = snap.data() as DesignProject;
          onUpdate(p);
        }
      });
    } catch {
      // Fallback
    }
  }

  // Fallback no-op unsubscribe
  return () => {};
}

/**
 * Auto-save project changes to persistent storage & database
 */
export async function saveProject(project: DesignProject): Promise<void> {
  const updatedProject: DesignProject = {
    ...project,
    updatedAt: new Date().toISOString()
  };

  // 1. Local mirror
  const localMap = getLocalProjects();
  localMap[project.id] = updatedProject;
  saveLocalProjects(localMap);

  // 2. Cloud Firestore
  if (isFirebaseConfigured && employeeDb) {
    try {
      await setDoc(doc(employeeDb, 'design_projects', project.id), updatedProject, { merge: true });
    } catch (err) {
      console.warn('Firestore auto-save notice (local saved):', err);
    }
  }
}

/**
 * Duplicate a design project
 */
export async function duplicateProject(
  projectId: string, 
  userId: string,
  userEmail: string,
  userName: string
): Promise<DesignProject> {
  const { project } = await getProjectById(projectId, userId, userEmail);
  if (!project) throw new Error('Project not found or unauthorized');

  const duplicated = await createProject({
    title: `${project.title} (Copy)`,
    ownerId: userId,
    ownerEmail: userEmail,
    ownerName: userName,
    preset: project.preset,
    width: project.width,
    height: project.height,
    initialSlides: JSON.parse(JSON.stringify(project.slides)),
    folderId: project.folderId
  });

  return duplicated;
}

/**
 * Delete a design project
 */
export async function deleteProject(
  projectId: string, 
  userId: string, 
  userEmail: string
): Promise<void> {
  const { project, canEdit } = await getProjectById(projectId, userId, userEmail);
  if (!project || !canEdit) throw new Error('Project not found or unauthorized');

  // Only the owner can delete the project
  const isOwner = project.ownerId === userId || project.ownerEmail === userEmail.toLowerCase();
  if (!isOwner) throw new Error('Only the design owner can delete this project.');

  // 1. Local storage remove
  const localMap = getLocalProjects();
  delete localMap[projectId];
  saveLocalProjects(localMap);

  // 2. Firestore remove
  if (isFirebaseConfigured && employeeDb) {
    try {
      await deleteDoc(doc(employeeDb, 'design_projects', projectId));
    } catch (err) {
      console.warn('Firestore delete notice:', err);
    }
  }
}

/**
 * Rename project title
 */
export async function renameProject(
  projectId: string, 
  newTitle: string, 
  userId: string, 
  userEmail: string
): Promise<void> {
  const { project, canEdit } = await getProjectById(projectId, userId, userEmail);
  if (!project || !canEdit) throw new Error('Unauthorized');

  project.title = newTitle.trim() || 'Untitled Design';
  await saveProject(project);
}

/**
 * Move design project into a folder
 */
export async function moveProjectToFolder(
  projectId: string, 
  folderId: string | null, 
  userId: string, 
  userEmail: string
): Promise<void> {
  const { project, canEdit } = await getProjectById(projectId, userId, userEmail);
  if (!project || !canEdit) throw new Error('Unauthorized');

  project.folderId = folderId;
  await saveProject(project);
}

/**
 * Share a design with an authorized employee with viewer or editor permission
 */
export async function shareProject(
  projectId: string,
  targetEmail: string,
  role: 'viewer' | 'editor',
  userId: string,
  userEmail: string
): Promise<DesignProject> {
  const { project, canEdit } = await getProjectById(projectId, userId, userEmail);
  if (!project || !canEdit) throw new Error('Unauthorized to share this project.');

  const cleanEmail = targetEmail.trim().toLowerCase();
  if (cleanEmail === project.ownerEmail.toLowerCase()) {
    throw new Error('You are already the owner of this design.');
  }

  // Remove existing collaborator entry if present
  const updatedShared: ProjectCollaborator[] = (project.sharedWith || []).filter(
    c => c.email.toLowerCase() !== cleanEmail
  );

  updatedShared.push({
    email: cleanEmail,
    role,
    addedAt: new Date().toISOString()
  });

  project.sharedWith = updatedShared;
  await saveProject(project);
  return project;
}

/**
 * Remove collaborator from design
 */
export async function removeCollaborator(
  projectId: string,
  targetEmail: string,
  userId: string,
  userEmail: string
): Promise<DesignProject> {
  const { project, canEdit } = await getProjectById(projectId, userId, userEmail);
  if (!project || !canEdit) throw new Error('Unauthorized to manage collaborators.');

  const cleanEmail = targetEmail.trim().toLowerCase();
  project.sharedWith = (project.sharedWith || []).filter(
    c => c.email.toLowerCase() !== cleanEmail
  );

  await saveProject(project);
  return project;
}

// ----------------- FOLDER MANAGEMENT -----------------

export async function getUserFolders(userId: string): Promise<DesignFolder[]> {
  const localFolders = getLocalFolders();
  const userFolders = Object.values(localFolders).filter(f => f.ownerId === userId);

  if (isFirebaseConfigured && employeeDb) {
    try {
      const q = query(collection(employeeDb, 'design_folders'), where('ownerId', '==', userId));
      const snaps = await getDocs(q);
      const fsFolders: Record<string, DesignFolder> = {};
      snaps.forEach(d => {
        const f = d.data() as DesignFolder;
        fsFolders[f.id] = f;
      });
      Object.assign(localFolders, fsFolders);
      saveLocalFolders(localFolders);
      return Object.values(localFolders).filter(f => f.ownerId === userId);
    } catch {
      // Fallback
    }
  }

  return userFolders;
}

export async function createFolder(
  userId: string, 
  name: string, 
  color = '#dc2626'
): Promise<DesignFolder> {
  const folderId = 'fold-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const newFolder: DesignFolder = {
    id: folderId,
    name: name.trim() || 'New Folder',
    ownerId: userId,
    color,
    createdAt: new Date().toISOString()
  };

  const localFolders = getLocalFolders();
  localFolders[folderId] = newFolder;
  saveLocalFolders(localFolders);

  if (isFirebaseConfigured && employeeDb) {
    try {
      await setDoc(doc(employeeDb, 'design_folders', folderId), newFolder);
    } catch {}
  }

  return newFolder;
}

export async function deleteFolder(folderId: string): Promise<void> {
  const localFolders = getLocalFolders();
  delete localFolders[folderId];
  saveLocalFolders(localFolders);

  if (isFirebaseConfigured && employeeDb) {
    try {
      await deleteDoc(doc(employeeDb, 'design_folders', folderId));
    } catch {}
  }
}

/**
 * Export a DesignProject to an offline .infyum.json file
 */
export function exportProjectToJsonFile(project: DesignProject): void {
  const data = JSON.stringify(project, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const filename = `${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.infyum.json`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Import a DesignProject from an offline .infyum.json file
 */
export async function importProjectFromJsonFile(file: File): Promise<DesignProject> {
  const text = await file.text();
  const parsed = JSON.parse(text) as DesignProject;
  if (!parsed.id || !parsed.slides || !Array.isArray(parsed.slides)) {
    throw new Error('Invalid INFYUM project file format');
  }
  // Assign new ID to prevent colliding with existing project
  const newId = 'proj-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const importedProject: DesignProject = {
    ...parsed,
    id: newId,
    title: `${parsed.title} (Imported)`,
    updatedAt: new Date().toISOString()
  };
  await saveProject(importedProject);
  return importedProject;
}
