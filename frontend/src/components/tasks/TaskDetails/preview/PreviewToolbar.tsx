import {
  ExternalLink,
  RefreshCw,
  Copy,
  Loader2,
  Pause,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NewCardHeader } from '@/components/ui/new-card';
import type { DevserverUrlInfo } from '@/hooks/useDevserverUrl';

interface PreviewToolbarProps {
  mode: 'noServer' | 'error' | 'ready';
  url?: string;
  allUrls?: DevserverUrlInfo[];
  selectedUrlIndex?: number;
  onSelectUrl?: (index: number) => void;
  onRefresh: () => void;
  onCopyUrl: () => void;
  onStop: () => void;
  isStopping?: boolean;
}

export function PreviewToolbar({
  mode,
  url,
  allUrls = [],
  selectedUrlIndex = 0,
  onSelectUrl,
  onRefresh,
  onCopyUrl,
  onStop,
  isStopping,
}: PreviewToolbarProps) {
  const { t } = useTranslation('tasks');
  const hasMultipleUrls = allUrls.length > 1;

  const actions =
    mode !== 'noServer' ? (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="icon"
                aria-label={t('preview.toolbar.refresh')}
                onClick={onRefresh}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('preview.toolbar.refresh')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="icon"
                aria-label={t('preview.toolbar.copyUrl')}
                onClick={onCopyUrl}
                disabled={!url}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('preview.toolbar.copyUrl')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="icon"
                aria-label={t('preview.toolbar.openInTab')}
                asChild
                disabled={!url}
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('preview.toolbar.openInTab')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-4 w-px bg-border" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="icon"
                aria-label={t('preview.toolbar.stopDevServer')}
                onClick={onStop}
                disabled={isStopping}
              >
                {isStopping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pause className="h-4 w-4 text-destructive" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('preview.toolbar.stopDevServer')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </>
    ) : undefined;

  // URL display with optional dropdown for multiple URLs
  const urlDisplay = hasMultipleUrls ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1 text-sm text-muted-foreground font-mono truncate whitespace-nowrap hover:text-foreground transition-colors cursor-pointer"
          aria-label={t('preview.toolbar.selectUrl')}
        >
          <span className="truncate">{url}</span>
          <ChevronDown className="h-3 w-3 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-w-md">
        {allUrls.map((urlInfo, index) => (
          <DropdownMenuItem
            key={urlInfo.url}
            onClick={() => onSelectUrl?.(index)}
            className={`font-mono text-xs ${index === selectedUrlIndex ? 'bg-accent' : ''}`}
          >
            {urlInfo.url}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <span
      className="text-sm text-muted-foreground font-mono truncate whitespace-nowrap"
      aria-live="polite"
    >
      {url || <Loader2 className="h-4 w-4 animate-spin" />}
    </span>
  );

  return (
    <NewCardHeader className="shrink-0" actions={actions}>
      <div className="flex items-center">{urlDisplay}</div>
    </NewCardHeader>
  );
}
