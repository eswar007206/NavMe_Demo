import DataTable from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import type { TableConfig } from "@/lib/tableConfig";

interface TablePageProps {
  config: TableConfig;
}

export default function TablePage({ config }: TablePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={config.displayName}
        description={config.description}
      />
      <DataTable config={config} />
    </div>
  );
}
