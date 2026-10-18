import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./Card";

const meta = {
  title: "UI/Card",
  component: Card,
  render: (args) => (
    <Card {...args} className="w-96" aria-labelledby="card-title">
      <CardHeader>
        <CardTitle id="card-title">Average time to resolve</CardTitle>
        <CardDescription>Requests resolved in the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">2.1 days</p>
      </CardContent>
      <CardFooter>
        <Button variant="link">See all requests</Button>
      </CardFooter>
    </Card>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
