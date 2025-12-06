import { UploadCard } from '@/components/data/UploadCard';
import { DataTable } from '@/components/data/DataTable';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { FileSpreadsheet, Database, Zap } from 'lucide-react';

export default function DataExplorer() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Explorer</h1>
        <p className="text-muted-foreground mt-1">
          Upload your data and let AI uncover valuable insights.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-medium text-foreground">Multiple Formats</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Support for CSV and XLSX files up to 10MB
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-3">
            <Database className="w-5 h-5 text-success" />
          </div>
          <h3 className="font-medium text-foreground">Smart Parsing</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Automatic data type detection and cleaning
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5 text-warning" />
          </div>
          <h3 className="font-medium text-foreground">AI Analysis</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Get instant insights powered by AI
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Upload Data" subtitle="Drag and drop or browse files">
          <UploadCard />
        </ChartCard>

        <ChartCard title="Recent Uploads" subtitle="Your previously analyzed files">
          <div className="space-y-3">
            {[
              { name: 'sales_q2_2024.csv', date: 'Jul 25, 2024', rows: '1,247' },
              { name: 'customers_export.xlsx', date: 'Jul 23, 2024', rows: '5,892' },
              { name: 'inventory_report.csv', date: 'Jul 20, 2024', rows: '342' },
            ].map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.rows} rows</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{file.date}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Data Preview */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">Data Preview</h3>
        <DataTable />
      </div>
    </div>
  );
}
