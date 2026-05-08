/**
 * Approval Modal Component
 * Shows pending actions that require user approval
 */

import { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Approval {
  id: string;
  tool_name: string;
  parameters: any;
  risk_level: 'low' | 'medium' | 'high';
  reasoning?: string;
  expires_at: string;
  created_at: string;
}

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress: string;
  onApprove: (approvalId: string) => Promise<void>;
  onReject: (approvalId: string) => Promise<void>;
}

export function ApprovalModal({
  isOpen,
  onClose,
  userAddress,
  onApprove,
  onReject,
}: ApprovalModalProps) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userAddress) {
      loadApprovals();
    }
  }, [isOpen, userAddress]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_AGENT_API_URL}/agent/approvals/${userAddress}`
      );
      const data = await response.json();
      setApprovals(data.approvals || []);
    } catch (error) {
      console.error('Failed to load approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    setProcessing(approvalId);
    try {
      await onApprove(approvalId);
      await loadApprovals(); // Refresh list
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (approvalId: string) => {
    setProcessing(approvalId);
    try {
      await onReject(approvalId);
      await loadApprovals(); // Refresh list
    } catch (error) {
      console.error('Rejection failed:', error);
    } finally {
      setProcessing(null);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-red-500 bg-red-500/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      default:
        return 'text-green-500 bg-green-500/10';
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 0) return 'Expired';
    if (minutes < 1) return 'Less than 1 minute';
    return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-gray-900 border border-gray-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Pending Approvals</h2>
            <p className="text-sm text-gray-400 mt-1">
              Review and approve actions before execution
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-400">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
                >
                  {/* Risk Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getRiskColor(approval.risk_level)}`}
                    >
                      {approval.risk_level} Risk
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimeRemaining(approval.expires_at)}
                    </span>
                  </div>

                  {/* Action Details */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {approval.tool_name.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                    
                    {approval.reasoning && (
                      <p className="text-sm text-gray-400 mb-3">
                        {approval.reasoning}
                      </p>
                    )}

                    {/* Parameters */}
                    <div className="bg-gray-900/50 rounded p-3 space-y-1">
                      {Object.entries(approval.parameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-500">{key}:</span>
                          <span className="text-gray-300 font-mono">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Warning */}
                  {approval.risk_level === 'high' && (
                    <div className="flex items-start gap-2 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">
                        This action will execute a real blockchain transaction. Make sure you understand what will happen before approving.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(approval.id)}
                      disabled={processing === approval.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      {processing === approval.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(approval.id)}
                      disabled={processing === approval.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
