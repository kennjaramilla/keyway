import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { StatusBadge } from "../badge";
import {
  SortableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type SortDirection,
} from "./Table";

const rows = [
  { number: "KW-1023", title: "Dishwasher leaves dishes wet", status: "Triaged", age: 2 },
  { number: "KW-1017", title: "No hot water in shower", status: "New", age: 4 },
  { number: "KW-1030", title: "Front door lock sticks", status: "New", age: 1 },
];

function SortableTable() {
  const [direction, setDirection] = useState<SortDirection>("asc");
  const sorted = [...rows].sort((a, b) => (direction === "asc" ? a.age - b.age : b.age - a.age));
  return (
    <Table>
      <caption className="sr-only">Open requests</caption>
      <TableHeader>
        <TableRow>
          <TableHead>Request</TableHead>
          <TableHead>Status</TableHead>
          <SortableHead
            direction={direction}
            onSort={() => setDirection(direction === "asc" ? "desc" : "asc")}
          >
            Age (days)
          </SortableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.number}>
            <TableCell>
              <span className="font-medium">{row.number}</span> {row.title}
            </TableCell>
            <TableCell>
              <StatusBadge tone={row.status === "New" ? "info" : "primary"}>
                {row.status}
              </StatusBadge>
            </TableCell>
            <TableCell>{row.age}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const meta = {
  title: "UI/Table",
  component: Table,
  parameters: { layout: "padded" },
  render: () => <SortableTable />,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sortable: Story = {};
