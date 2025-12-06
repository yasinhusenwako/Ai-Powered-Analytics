import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { analyzeUploadedData } from '@/lib/mockApi';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export function UploadCard() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV or XLSX file',
        variant: 'destructive',
      });
      return;
    }

    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    setAnalysis(null);
    toast({
      title: 'File uploaded',
      description: `${file.name} ready for analysis`,
    });
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeUploadedData(uploadedFile.name);
      setAnalysis(result);
      toast({
        title: 'Analysis complete',
        description: 'AI has analyzed your data',
      });
    } catch (error) {
      toast({
        title: 'Analysis failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setAnalysis(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/50',
          uploadedFile && 'border-success bg-success/5'
        )}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="space-y-4">
          <div
            className={cn(
              'w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-colors',
              uploadedFile ? 'bg-success/10' : 'bg-muted'
            )}
          >
            {uploadedFile ? (
              <FileSpreadsheet className="w-8 h-8 text-success" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          {uploadedFile ? (
            <div className="space-y-2">
              <p className="font-medium text-foreground">{uploadedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(uploadedFile.size)}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  removeFile();
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <>
              <div>
                <p className="font-medium text-foreground">
                  Drop your file here, or browse
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports CSV and XLSX files
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Analyze button */}
      {uploadedFile && !analysis && (
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate AI Insights
            </>
          )}
        </Button>
      )}

      {/* Analysis result */}
      {analysis && (
        <div className="p-4 rounded-xl bg-muted border border-border animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">AI Analysis</span>
          </div>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}
