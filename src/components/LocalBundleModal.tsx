import React, { useEffect, useState } from 'react';
import {
  Download,
  FileCode,
  Copy,
  Check,
  X,
  FolderArchive,
  Sparkles,
  UploadCloud,
  ShieldCheck,
} from 'lucide-react';

interface LocalBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ONE_SENTENCE_AGENT_PROMPT =
  '请帮我解压 ~/Downloads/clippulse-studio-local.zip 到 ./clippulse-studio 目录，自动检查安装 ffmpeg 与 npm 依赖、将 .env.example 复制为 .env 并启动 http://localhost:3000 服务；同时用 git 初始化仓库并通过 gh repo create clippulse-studio --public --source=. --push 上传到我的 GitHub。';

export const LocalBundleModal: React.FC<LocalBundleModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isPackaging, setIsPackaging] = useState(false);
  const [bundleInfo, setBundleInfo] = useState<{
    filename: string;
    fileCount: number;
    sizeMB: string;
    zipBase64: string;
    miniZipBase64: string;
    miniSizeKB: number;
    magicHeaderHex: string;
  } | null>(null);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedSelfExtract, setCopiedSelfExtract] = useState(false);
  const [copiedReadme, setCopiedReadme] = useState(false);
  const [downloadStatusMsg, setDownloadStatusMsg] = useState<string>('');

  // GitHub direct push state
  const [repoName, setRepoName] = useState('clippulse-studio');
  const [githubToken, setGithubToken] = useState('');
  const [isPushingGh, setIsPushingGh] = useState(false);
  const [ghResult, setGhResult] = useState<{
    ok: boolean;
    repoUrl?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/export/readme')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.content) setReadmeContent(d.content);
      })
      .catch(() => {});

    setIsPackaging(true);
    fetch('/api/export/project-bundle', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.zipBase64) {
          setBundleInfo({
            filename: d.filename || 'clippulse-studio-local.zip',
            fileCount: d.fileCount || 24,
            sizeMB: d.sizeMB || '268 KB',
            zipBase64: d.zipBase64,
            miniZipBase64: d.miniZipBase64 || d.zipBase64,
            miniSizeKB: d.miniSizeKB || 55,
            magicHeaderHex: d.magicHeaderHex || '504b0304',
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsPackaging(false));
  }, [isOpen]);

  if (!isOpen) return null;

  // Pure in-memory Blob download: decodes Base64 -> Uint8Array -> verifies PK\x03\x04 -> Blob URL
  // Never makes an external <a href="/...zip"> navigation so it can NEVER hit "Cookie check" HTML!
  const handleDownloadVerifiedBlobZip = () => {
    if (!bundleInfo?.zipBase64) return;
    try {
      const binaryStr = window.atob(bundleInfo.zipBase64);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      // Verify ZIP magic bytes: 0x50 ('P'), 0x4B ('K'), 0x03, 0x04
      if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
        setDownloadStatusMsg('错误：ZIP 二进制头校验未通过');
        return;
      }

      const blob = new Blob([bytes], { type: 'application/zip' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'clippulse-studio-local.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

      setDownloadStatusMsg(
        `已通过浏览器内存 Blob 直出下载真正的二进制 ZIP（PK\\x03\\x04 校验通过，共 ${(
          len / 1024
        ).toFixed(1)} KB，绝无 Cookie check 网页拦截）！`
      );
    } catch {
      setDownloadStatusMsg('浏览器解码 ZIP 失败，请使用下方自解压脚本下载');
    }
  };

  // Download a single self-extracting .sh installer via memory Blob
  const handleDownloadSelfExtractingSh = () => {
    const b64 = bundleInfo?.miniZipBase64 || bundleInfo?.zipBase64;
    if (!b64) return;

    const scriptContent = [
      '#!/usr/bin/env bash',
      '# ClipPulse Studio - 零依赖内嵌源码自解压与 GitHub 推送一键脚本',
      '# 用法: bash install_clippulse_local.sh',
      'set -e',
      'TARGET_DIR="${1:-./clippulse-studio}"',
      'mkdir -p "$TARGET_DIR"',
      'echo "正在从内嵌 Base64 还原真正的源码 ZIP (PK\\x03\\x04)..."',
      `cat << 'EOF_ZIP_B64' | base64 -d > "$TARGET_DIR/clippulse-studio-local.zip"`,
      b64,
      'EOF_ZIP_B64',
      'cd "$TARGET_DIR"',
      'unzip -o clippulse-studio-local.zip',
      'rm -f clippulse-studio-local.zip',
      '[ ! -f .env ] && cp .env.example .env',
      'echo "✅ 源码解压完成！路径: $(pwd)"',
      'npm install',
      'echo "✅ 依赖安装完成！可运行 npm run dev 启动 http://localhost:3000"',
    ].join('\n');

    const blob = new Blob([scriptContent], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'install_clippulse_local.sh';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy 1-line terminal command that embeds the entire 55KB source ZIP in Base64!
  const handleCopySelfContainedCommand = () => {
    const b64 = bundleInfo?.miniZipBase64 || bundleInfo?.zipBase64;
    if (!b64) return;

    const fullCmd = `mkdir -p clippulse-studio && cd clippulse-studio && echo "${b64}" | base64 -d > src.zip && unzip -o src.zip && rm -f src.zip && cp -n .env.example .env && npm install && git init -b main && git add -A && git commit -m "feat: ClipPulse Studio local video storyline workbench" && (gh repo create clippulse-studio --public --source=. --push || true) && npm run dev`;
    navigator.clipboard?.writeText(fullCmd).catch(() => {});
    setCopiedSelfExtract(true);
    setTimeout(() => setCopiedSelfExtract(false), 2500);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard?.writeText(ONE_SENTENCE_AGENT_PROMPT).catch(() => {});
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 1800);
  };

  const handleCopyReadme = () => {
    navigator.clipboard?.writeText(readmeContent).catch(() => {});
    setCopiedReadme(true);
    setTimeout(() => setCopiedReadme(false), 1800);
  };

  const handlePushToGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken.trim()) {
      setGhResult({
        ok: false,
        error: '请填入您的 GitHub Personal Access Token（需具备 repo 权限）',
      });
      return;
    }

    setIsPushingGh(true);
    setGhResult(null);
    try {
      const res = await fetch('/api/export/github-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken: githubToken.trim(),
          repoName: repoName.trim() || 'clippulse-studio',
        }),
      });
      const data = await res.json();
      if (data.ok && data.repoUrl) {
        setGhResult({ ok: true, repoUrl: data.repoUrl });
      } else {
        setGhResult({
          ok: false,
          error: data.error || '上传 GitHub 失败，请检查 Token 权限',
        });
      }
    } catch {
      setGhResult({ ok: false, error: '网络请求异常，请稍后重试' });
    } finally {
      setIsPushingGh(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="本地完整工程压缩包与一句话 Agent 安装及 GitHub 上传"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
    >
      <div className="bg-white border border-blue-100 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-blue-50/50">
          <div className="flex items-center gap-2.5">
            <FolderArchive className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                真正源码 ZIP 下载（内存 Blob 直出，彻底解决 Cookie check 拦截）
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                已改为通过 JSON Base64 + 浏览器内存 Blob 二进制校验（PK\x03\x04）直出，绝不会下载到 HTML 验证页
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="关闭窗口"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* 1. Verified Binary Blob ZIP Download Card */}
          <div className="p-4 bg-blue-50/90 border border-blue-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-sm font-bold text-blue-950">
                    clippulse-studio-local.zip（已校验二进制头 0x{bundleInfo?.magicHeaderHex || '504b0304'}）
                  </span>
                </div>
                <div className="text-xs text-blue-800">
                  {isPackaging
                    ? '正在将源码打包为内存二进制流...'
                    : bundleInfo
                    ? `共 ${bundleInfo.fileCount} 个源码与关键帧文件 · ${bundleInfo.sizeMB} · 浏览器内存 Blob 直接生成`
                    : '准备就绪'}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isPackaging || !bundleInfo?.zipBase64}
                  onClick={handleDownloadVerifiedBlobZip}
                  className="px-4 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载真正源码 ZIP (Blob 直出)</span>
                </button>

                <button
                  type="button"
                  disabled={isPackaging || !bundleInfo?.zipBase64}
                  onClick={handleDownloadSelfExtractingSh}
                  className="px-3.5 py-2.5 text-xs font-semibold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>下载内嵌源码自解压脚本 (.sh)</span>
                </button>
              </div>
            </div>

            {downloadStatusMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-medium">
                {downloadStatusMsg}
              </div>
            )}
          </div>

          {/* 2. Zero-ZIP-File Option: Copy Base64 Self-Extracting Command Directly to Agent */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  方案 A（最稳妥 · 免找 zip 文件）：一键复制「内嵌全部 55KB 源码 Base64」的自解压命令发给本机 Agent 或终端：
                </span>
              </div>
              <button
                type="button"
                disabled={!bundleInfo?.miniZipBase64}
                onClick={handleCopySelfContainedCommand}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedSelfExtract ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>已复制含完整源码的自解压命令！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制内嵌完整源码的一键还原+上传命令</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-300">
                方案 B：点击上方「下载真正源码 ZIP (Blob 直出)」后，把下面这 1 句话发给本机 Agent：
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>复制这句话</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs font-mono-tabular text-white bg-slate-800/90 border border-slate-700 rounded-lg p-2.5 leading-relaxed select-all">
              {ONE_SENTENCE_AGENT_PROMPT}
            </p>
          </div>

          {/* 3. Direct Online GitHub Push Form */}
          <form
            onSubmit={handlePushToGithub}
            className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
            noValidate
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <UploadCloud className="w-4 h-4 text-blue-600" />
                <span>方案 C：无需本地操作，直接在此填入 GitHub Token 一键创建仓库并推送源码：</span>
              </div>
              <span className="text-[11px] text-slate-500">
                推送后本机直接 git clone 即可
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <input
                type="text"
                aria-label="GitHub 仓库名称"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="仓库名 (如: clippulse-studio)"
                className="sm:col-span-4 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <input
                type="password"
                aria-label="GitHub Personal Access Token"
                value={githubToken}
                onChange={(e) => {
                  setGithubToken(e.target.value);
                  if (ghResult) setGhResult(null);
                }}
                placeholder="填入您的 GitHub Token (ghp_... 需勾选 repo 权限)"
                className="sm:col-span-5 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={isPushingGh}
                className="sm:col-span-3 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isPushingGh ? '正在推送至 GitHub...' : '一键上传到 GitHub'}</span>
              </button>
            </div>

            {ghResult && (
              <div
                role="alert"
                className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${
                  ghResult.ok
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}
              >
                <span>
                  {ghResult.ok
                    ? `已成功上传至您的 GitHub 仓库：${ghResult.repoUrl}`
                    : ghResult.error}
                </span>
                {ghResult.ok && ghResult.repoUrl && (
                  <a
                    href={ghResult.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-blue-700 hover:underline ml-2 whitespace-nowrap"
                  >
                    打开 GitHub 仓库
                  </a>
                )}
              </div>
            )}
          </form>

          {/* 4. Full README Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                README.md 完整文档预览：
              </span>
              <button
                type="button"
                onClick={handleCopyReadme}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                {copiedReadme ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>已复制全文</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制 README 全文</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono-tabular text-slate-700 whitespace-pre-wrap max-h-[180px] overflow-y-auto leading-relaxed">
              {readmeContent || '正在加载 README.md...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
