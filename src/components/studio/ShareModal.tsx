import React, { useState } from 'react';
import type { DesignProject, ProjectCollaborator } from '../../types/design';
import { shareProject, removeCollaborator } from '../../services/designService';
import { 
  X, 
  UserPlus, 
  Shield, 
  Trash2, 
  Check, 
  Mail, 
  Eye, 
  Edit3, 
  Users,
  Lock
} from 'lucide-react';

interface ShareModalProps {
  project: DesignProject;
  currentUserId: string;
  currentUserEmail: string;
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated: (updatedProject: DesignProject) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  project,
  currentUserId,
  currentUserEmail,
  isOpen,
  onClose,
  onProjectUpdated
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await shareProject(
        project.id,
        emailInput.trim(),
        role,
        currentUserId,
        currentUserEmail
      );
      onProjectUpdated(updated);
      setSuccessMessage(`Successfully shared with ${emailInput.trim()} as ${role}.`);
      setEmailInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to share project';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (targetEmail: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const updated = await removeCollaborator(
        project.id,
        targetEmail,
        currentUserId,
        currentUserEmail
      );
      onProjectUpdated(updated);
      setSuccessMessage(`Removed access for ${targetEmail}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove collaborator';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOwner = project.ownerId === currentUserId || project.ownerEmail.toLowerCase() === currentUserEmail.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Share Design</h3>
              <p className="text-xs text-slate-300 truncate max-w-xs">{project.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Privacy Notice */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p>
              <strong>Private by default:</strong> Only you and employees explicitly invited below can access this design. Teammates cannot see your private workspace.
            </p>
          </div>

          {/* Form to invite */}
          {isOwner && (
            <form onSubmit={handleShare} className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Invite Employee by Email
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="colleague@infyum.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-red-600 rounded-xl text-sm focus:outline-hidden transition-all"
                  />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-red-600"
                >
                  <option value="editor">Can edit</option>
                  <option value="viewer">Can view</option>
                </select>
                <button
                  type="submit"
                  disabled={isSubmitting || !emailInput.trim()}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm shadow-red-600/30 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite</span>
                </button>
              </div>

              {errorMessage && (
                <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
              )}
              {successMessage && (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {successMessage}
                </p>
              )}
            </form>
          )}

          {/* Collaborators list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              People with access ({1 + (project.sharedWith?.length || 0)})
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {/* Owner */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center">
                    {project.ownerName ? project.ownerName.charAt(0).toUpperCase() : 'O'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{project.ownerName}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold">Owner</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{project.ownerEmail}</span>
                  </div>
                </div>
                <Shield className="w-4 h-4 text-slate-400" />
              </div>

              {/* Shared Collaborators */}
              {project.sharedWith && project.sharedWith.length > 0 ? (
                project.sharedWith.map((collab: ProjectCollaborator) => (
                  <div 
                    key={collab.email}
                    className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {collab.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900 truncate max-w-[180px]">
                            {collab.email}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          {collab.role === 'editor' ? (
                            <>
                              <Edit3 className="w-3 h-3 text-red-600" /> Can edit
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-slate-500" /> Can view
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => handleRemove(collab.email)}
                        disabled={isSubmitting}
                        title="Remove access"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-400 italic">
                  Not shared with anyone yet. Only you can view this design.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
