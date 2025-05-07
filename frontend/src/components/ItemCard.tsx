// src/components/ItemCard.tsx
import { useState } from "react";
import { ItemSmall } from "../types";
import ItemForm from "./ItemForm";

interface ItemCardProps {
  item: ItemSmall;
}

export default function ItemCard({ item }: ItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <ItemForm initialData={item} onSuccess={() => setIsEditing(false)} />
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 h-full relative flex flex-col justify-between">
      <div className="absolute top-3 right-3">
        <ItemForm initialData={item} ButtonTitle="E" />
      </div>

      {/* Top content */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium">{item.item_nome}</h3>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Codigo: {item.item_codigo}</p>
            <p>Sequencia: {item.item_sequencia}</p>
            <p>
              ultimo bd dump: {new Date(item.updated_at).toLocaleDateString()}
            </p>
            <p>Autor: {item.item_criador}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
