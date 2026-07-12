"use client";

import { useState } from "react";
import VehicleTable from "@/components/VehicleTable";
import VehicleForm from "@/components/VehicleForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default function DashboardPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Fleet Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your vehicles, monitor status, and track load parameters.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger
            render={
              <Button className="h-10 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 font-semibold gap-2">
                <PlusIcon className="size-4" />
                Add Vehicle
              </Button>
            }
          />
          <DialogContent className="sm:max-w-2xl">
            <VehicleForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <VehicleTable onEdit={(id) => setEditingId(id)} />

      {/* Edit Vehicle Dialog */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="sm:max-w-2xl">
          {editingId && (
            <VehicleForm
              vehicleId={editingId}
              onSuccess={() => setEditingId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
