// ItemManagement.tsx
import { useState, useEffect } from "react";
import { useQuery } from "react-query";
import { fetchItems } from "../api";
import ItemList from "./ItemList";
import FilterBar from "./FilterBar";
import { Filters } from "../types";
import { Pagination } from "./Pagination";

export default function ItemManagement() {
  // ItemManagement.tsx

  const [filters, setFilters] = useState<Filters>({
    name: "",
    tableTag: [],
    columnTag: [],
    page: 1,
    pageSize: 20,
  });

  useEffect(() => {
    console.log("Current filters:", filters);
  }, [filters]);

  const {
    data: itemsResponse,
    isLoading,
    isFetching,
  } = useQuery(["items", JSON.stringify(filters)], () => fetchItems(filters), {
    keepPreviousData: true,
    retry: false,
    staleTime: 30000,
  });

  const totalPages = itemsResponse
    ? Math.ceil(itemsResponse.total / filters.pageSize)
    : 0;

  return (
    <div className="w-full flex flex-col items-center px-4 py-4">
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-8 w-full">
          <FilterBar filters={filters} setFilters={setFilters} />
          <ItemList
            items={itemsResponse?.items ?? []}
            isLoading={isLoading}
            isFetching={isFetching}
          />
          {totalPages > 0 && (
            <Pagination
              currentPage={filters.page}
              totalPages={totalPages}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
