import { WorkspaceShell } from "@/components/shell/WorkspaceShell";

export default function WorkspaceLayout({ children }: LayoutProps<"/">) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
