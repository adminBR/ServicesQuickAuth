import React, { useState, useCallback } from "react";
import AsyncSelect from "react-select/async";
import debounce from "lodash/debounce";
import { fetchTags } from "../api";
import { Filters } from "../types";

interface FilterBarProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

export default function FilterBar({ filters, setFilters }: FilterBarProps) {
  const [localName, setLocalName] = useState(filters.name);

  const debouncedSetFilters = useCallback(
    debounce((newFilters: Partial<Filters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
    }, 300),
    []
  );

  const loadOptions = async (category: string, inputValue: string) => {
    const response = await fetchTags(category, inputValue);
    return response.map((tag: string) => ({ value: tag, label: tag }));
  };

  const loadTableOptions = (inputValue: string) =>
    loadOptions("tables", inputValue);
  const loadColumnOptions = (inputValue: string) =>
    loadOptions("columns", inputValue);

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Relatórios TASY</h1>
        <div className="grid gap-4 md:grid-cols-3 w-full md:w-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pesquisa por nome:
            </label>
            <input
              type="text"
              value={localName}
              onChange={(e) => {
                setLocalName(e.target.value);
                debouncedSetFilters({ name: e.target.value });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Search items..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Filtro de tabelas:
            </label>
            <AsyncSelect
              isMulti
              cacheOptions
              defaultOptions
              loadOptions={loadTableOptions}
              value={filters.tableTag?.map((tag) => ({
                value: tag,
                label: tag,
              }))}
              onChange={(options) =>
                setFilters((prev) => ({
                  ...prev,
                  tableTag: options ? options.map((opt) => opt.value) : [],
                  page: 1,
                }))
              }
              isClearable
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Filtro de colunas:
            </label>
            <AsyncSelect
              isMulti
              cacheOptions
              defaultOptions
              loadOptions={loadColumnOptions}
              value={filters.columnTag?.map((tag) => ({
                value: tag,
                label: tag,
              }))}
              onChange={(options) =>
                setFilters((prev) => ({
                  ...prev,
                  columnTag: options ? options.map((opt) => opt.value) : [],
                  page: 1,
                }))
              }
              isClearable
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
