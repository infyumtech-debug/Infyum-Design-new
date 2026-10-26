import React, { useState, useEffect } from 'react';
import type { DesignProject, DesignFolder, CanvasPreset } from '../../types/design';
import { CANVAS_PRESETS } from '../../types/design';
import { 
  getUserProjects, 
  createProject, 
  duplicateProject, 
  deleteProject, 
  getUserFolders, 
  createFolder 
} from '../../services/designService';
import { STARTER_TEMPLATES } from '../../services/templateService';
import { 
  Plus, 
  Search, 
  Folder, 
  FolderPlus, 
  MoreVertical, 
  Trash2, 
  Copy, 
  Edit3, 
  LayoutTemplate, 
  Sparkles, 
  Clock, 
  Users, 
  ArrowRight, 
  Image as ImageIcon 
} from 'lucide-react';

interface ProjectsDashboardProps {
  userId: string;
  userEmail: string;
  userName: string;
  onOpenProject: (projectId: string) => void;
  onOpenBgRemover: () => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  userId,
  userEmail,
  userName,
  onOpenProject,
  onOpenBgRemover
}) => {
  const [projects, setProjects] = useState<DesignProject[]>([]);
  const [folders, setFolders] = useState<DesignFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'mine' | 'shared'>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectPreset, setNewProjectPreset] = useState<CanvasPreset>('instagram-square');
  const [newFolderName, setNewFolderName] = useState('');
  const [activeMenuProjectId, setActiveMenuProjectId] = useState<string | null>(null);

  // Load projects & folders
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [userProjs, userFolds] = await Promise.all([
        getUserProjects(userId, userEmail),
        getUserFolders(userId)
      ]);
      setProjects(userProjs);
      setFolders(userFolds);
    } catch (err) {
      console.error('Failed to load design projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, userEmail]);

  // Create new blank design
  const handleCreateProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const presetObj = CANVAS_PRESETS[newProjectPreset];
      const newProj = await createProject({
        title: newProjectTitle.trim() || 'Untitled Design',
        ownerId: userId,
        ownerEmail: userEmail,
        ownerName: userName,
        preset: newProjectPreset,
        width: presetObj.width,
        height: presetObj.height,
        folderId: selectedFolderId
      });
      setIsCreateModalOpen(false);
      setNewProjectTitle('');
      onOpenProject(newProj.id);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  // Start from a template
  const handleCreateFromTemplate = async (tmpl: typeof STARTER_TEMPLATES[0]) => {
    try {
      const presetObj = CANVAS_PRESETS[tmpl.preset];
      const newProj = await createProject({
        title: `${tmpl.name}`,
        ownerId: userId,
        ownerEmail: userEmail,
        ownerName: userName,
        preset: tmpl.preset,
        width: presetObj.width,
        height: presetObj.height,
        initialSlides: JSON.parse(JSON.stringify(tmpl.slides))
      });
      onOpenProject(newProj.id);
    } catch (err) {
      console.error('Failed to create from template:', err);
    }
  };

  // Duplicate project
  const handleDuplicate = async (projectId: string) => {
    try {
      await duplicateProject(projectId, userId, userEmail, userName);
      setActiveMenuProjectId(null);
      await loadData();
    } catch (err) {
      console.error('Duplicate failed:', err);
    }
  };

  // Delete project
  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this design? This action cannot be undone.')) return;
    try {
      await deleteProject(projectId, userId, userEmail);
      setActiveMenuProjectId(null);
      await loadData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await createFolder(userId, newFolderName.trim());
      setIsFolderModalOpen(false);
      setNewFolderName('');
      const f = await getUserFolders(userId);
      setFolders(f);
    } catch (err) {
      console.error('Folder creation failed:', err);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    // Search filter
    if (searchQuery.trim() && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Folder filter
    if (selectedFolderId !== null && p.folderId !== selectedFolderId) {
      return false;
    }

    // Tab filter
    const isOwner = p.ownerId === userId || p.ownerEmail === userEmail.toLowerCase();
    if (filterType === 'mine' && !isOwner) return false;
    if (filterType === 'shared' && isOwner) return false;

    return true;
  });

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 select-none">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 rounded-3xl border border-slate-800 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider">
              Free Studio Editor
            </span>
            <span className="text-slate-400 text-xs">• 100% Client-Side Privacy</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Design Studio & Carousel Builder
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Create multi-slide Instagram carousels, marketing graphics, and social posts with drag-and-drop layers, typography, and instant PDF/PNG export.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenBgRemover}
            className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-2xl text-xs font-bold transition-all border border-slate-700/80 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">AI Background Remover</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-red-600/30 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Design</span>
          </button>
        </div>
      </div>

      {/* Quick Format Starters Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Quick Start Presets
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { preset: 'instagram-square' as CanvasPreset, name: 'Instagram Square', size: '1080 × 1080', desc: '1:1 Standard Feed' },
            { preset: 'instagram-portrait' as CanvasPreset, name: 'Instagram Portrait', size: '1080 × 1350', desc: '4:5 High Impact' },
            { preset: 'instagram-story' as CanvasPreset, name: 'Story / Reel', size: '1080 × 1920', desc: '9:16 Full Screen' },
            { preset: 'custom' as CanvasPreset, name: '3-Slide Carousel', size: '1080 × 1080', desc: 'Narrative Story' }
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => {
                if (item.name === '3-Slide Carousel') {
                  const carouselTmpl = STARTER_TEMPLATES.find((t) => t.category === 'carousel');
                  if (carouselTmpl) handleCreateFromTemplate(carouselTmpl);
                } else {
                  setNewProjectPreset(item.preset);
                  setIsCreateModalOpen(true);
                }
              }}
              className="p-4 bg-white hover:bg-red-50/50 rounded-2xl border border-slate-200/80 hover:border-red-300 shadow-2xs hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-red-700 block">
                  {item.name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                  {item.size}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-3 flex items-center gap-1 font-medium">
                {item.desc} →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Starter Templates Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Professional Starter Templates
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STARTER_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => handleCreateFromTemplate(tmpl)}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-lg transition-all cursor-pointer flex flex-col"
            >
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                <img
                  src={tmpl.thumbnail}
                  alt={tmpl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs">
                  {tmpl.slides.length} {tmpl.slides.length === 1 ? 'Slide' : 'Slides'}
                </span>
              </div>
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-700">
                    {tmpl.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {tmpl.description}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-red-600 mt-2.5 flex items-center gap-1">
                  Use Template <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Section with Folders and Search */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => { setFilterType('all'); setSelectedFolderId(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all' && selectedFolderId === null
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Designs ({projects.length})
            </button>
            <button
              onClick={() => { setFilterType('mine'); setSelectedFolderId(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'mine' && selectedFolderId === null
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              My Designs
            </button>
            <button
              onClick={() => { setFilterType('shared'); setSelectedFolderId(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'shared' && selectedFolderId === null
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Shared with Me
            </button>
          </div>

          {/* Search Bar + New Folder Button */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-red-500 w-48 sm:w-56"
              />
            </div>

            <button
              onClick={() => setIsFolderModalOpen(true)}
              title="Create Folder"
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Custom Folder Pills */}
        {folders.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Folders:
            </span>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFolderId(selectedFolderId === f.id ? null : f.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 border transition-all cursor-pointer ${
                  selectedFolderId === f.id
                    ? 'bg-red-50 text-red-700 border-red-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-red-600" />
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Projects Grid */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-3 border-red-200 border-t-red-600 animate-spin" />
            <span className="text-xs text-slate-500">Loading your designs...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">No designs found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {searchQuery
                  ? `No designs matching "${searchQuery}".`
                  : 'Start by creating a blank canvas or picking one of the high-converting starter templates above.'}
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Create New Design
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map((p) => {
              const isOwner = p.ownerId === userId || p.ownerEmail === userEmail.toLowerCase();

              return (
                <div
                  key={p.id}
                  onClick={() => onOpenProject(p.id)}
                  className="group bg-white rounded-2xl border border-slate-200/80 hover:border-red-300 shadow-2xs hover:shadow-lg transition-all cursor-pointer flex flex-col relative"
                >
                  {/* Thumbnail Stage */}
                  <div className="relative aspect-square w-full bg-slate-900 rounded-t-2xl overflow-hidden flex items-center justify-center">
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        alt={p.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-600">
                        <ImageIcon className="w-8 h-8 opacity-40 text-white" />
                        <span className="text-[10px] text-slate-400 font-medium">Design Preview</span>
                      </div>
                    )}

                    {/* Slides badge */}
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs">
                      {p.slides.length} {p.slides.length === 1 ? 'Slide' : 'Slides'}
                    </span>

                    {/* Shared badge */}
                    {!isOwner && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-600/90 text-white text-[10px] font-bold flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" /> Shared
                      </span>
                    )}

                    {/* Menu button */}
                    <div 
                      className="absolute top-2 right-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setActiveMenuProjectId(activeMenuProjectId === p.id ? null : p.id)}
                        className="w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuProjectId === p.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-30 text-xs text-white animate-in fade-in duration-100">
                          <button
                            onClick={() => {
                              setActiveMenuProjectId(null);
                              onOpenProject(p.id);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-300" />
                            Open Editor
                          </button>
                          <button
                            onClick={() => handleDuplicate(p.id)}
                            className="w-full px-3 py-1.5 text-left hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-300" />
                            Duplicate
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="w-full px-3 py-1.5 text-left hover:bg-slate-800 text-red-400 hover:text-red-300 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-3.5 flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-700 truncate">
                        {p.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {p.width} × {p.height} • {p.preset}
                      </p>
                    </div>

                    <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                      <span className="font-semibold text-slate-600 truncate max-w-[100px]">
                        {isOwner ? 'You' : p.ownerName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE NEW DESIGN MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create New Design</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Design Title</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Product Drop Announcement"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Canvas Preset</label>
                <select
                  value={newProjectPreset}
                  onChange={(e) => setNewProjectPreset(e.target.value as CanvasPreset)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-red-500 font-medium"
                >
                  <option value="instagram-square">Instagram Square Post (1080 × 1080)</option>
                  <option value="instagram-portrait">Instagram Portrait Post (1080 × 1350)</option>
                  <option value="instagram-story">Instagram Story / Reel (1080 × 1920)</option>
                  <option value="facebook-post">Facebook Post (1200 × 630)</option>
                  <option value="youtube-thumbnail">YouTube Thumbnail (1280 × 720)</option>
                  <option value="twitter-header">Twitter / X Header (1500 × 500)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE FOLDER MODAL */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form onSubmit={handleCreateFolder} className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">New Design Folder</h3>
            <div>
              <label className="block text-xs text-slate-600 font-semibold mb-1">Folder Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Q3 Campaigns"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-red-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
