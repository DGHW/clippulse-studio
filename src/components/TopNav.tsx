import React from 'react';

export type WorkspaceSection = 'all' | 'step1' | 'step2' | 'step3';

interface TopNavProps {
  activeSection: WorkspaceSection;
  onSelectSection: (section: WorkspaceSection) => void;
  onRunAgentPipeline: () => void;
  isRunningPipeline: boolean;
  onOpenBundleModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeSection,
  onSelectSection,
  onRunAgentPipeline,
  isRunningPipeline,
  onOpenBundleModal,
}) => {
  const navItems: { id: WorkspaceSection; label: string; href: string }[] = [
    { id: 'all', label: '极简工作台', href: '#workbench' },
    { id: 'step1', label: '1. 选素材与模式', href: '#step-source' },
    { id: 'step2', label: '2. 调比例与模板', href: '#step-template' },
    { id: 'step3', label: '3. Agent 写稿与导出', href: '#step-script' },
  ];

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-blue-100 bg-white/95 sticky top-0 z-30 shadow-2xs">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#workbench"
        onClick={(e) => {
          e.preventDefault();
          onSelectSection('all');
        }}
        className="text-lg font-bold tracking-tight text-blue-700 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        ClipPulse Studio
      </a>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav aria-label="主工作区导航" className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                onSelectSection(item.id);
              }}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                isActive
                  ? 'text-blue-600 border-blue-600 font-semibold'
                  : 'text-slate-600 border-transparent hover:text-blue-600 hover:border-blue-200'
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Zone 3: Max 2 action items */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onOpenBundleModal}
          className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          下载本地工程包 (.zip)
        </button>
        <button
          type="button"
          onClick={onRunAgentPipeline}
          disabled={isRunningPipeline}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          {isRunningPipeline ? 'Agent 正在生成解说稿...' : '一键生成当前视频解说稿'}
        </button>
      </div>
    </header>
  );
};
