// src/components/ItemList.tsx
import ItemCard from "./ItemCard";
import { ItemSmall } from "../types";

interface ItemListProps {
  items: ItemSmall[];
  isLoading: boolean;
  isFetching: boolean;
}

export default function ItemList({
  items,
  isLoading,
  isFetching,
}: ItemListProps) {
  if (isLoading) {
    return <div className="text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="relative">
      {isFetching && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center text-gray-500">
            No items found
          </div>
        )}
      </div>
    </div>
  );
}
