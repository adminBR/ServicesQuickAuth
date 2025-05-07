import React, { useState, useEffect } from "react";
import { ItemSmall } from "../types";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "react-query";
import { fetchItem } from "../api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

interface ItemFormProps {
  initialData: ItemSmall;
  onSuccess?: () => void;
  ButtonTitle?: string;
}

export default function ItemForm({
  initialData,
  ButtonTitle,
}: ItemFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState<number | null>(null);

  const { data: item } = useQuery(
    ["item", initialData.id],
    () => fetchItem(""+initialData.id),
    {
      enabled: isOpen,
      staleTime: 30000,
    }
  );

  const { control, reset, watch } = useForm({
    defaultValues: {
      item_codigo: "",
      item_sequencia: "",
      item_criador: "",
      item_nome: "",
      item_query: "",
      descricao: "",
      item_image: new Uint8Array(),
      table_tags: [],
      column_tags: [],
    },
    values: item,
  });

  useEffect(() => {
    if (item) {
      reset(item);
      console.log(item);
    }
  }, [item, reset]);

  const queries = watch("item_query");
  const parsedQueries = React.useMemo(() => {
    try {
      return typeof queries === "string" ? JSON.parse(queries) : [];
    } catch {
      return [];
    }
  }, [queries]);


  const handleExpandInfo = (index: number) => {
    setExpandedInfo(expandedInfo === index ? null : index);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {ButtonTitle ? <FontAwesomeIcon icon={faEye} /> : "Novo Item"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsOpen(false)}
            />

            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-6xl">
              <div className="bg-white p-6">
                <form className="flex gap-6">
                  {/* Left Column */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Código:
                        </label>
                            <input
                              value={item?.item_codigo}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Sequência:
                        </label>
                        
                            <input
                              value={item?.item_sequencia}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nome do relatório:
                      </label>
                          <input
                            value={item?.item_nome}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Descrição:
                      </label>
                          <textarea
                            value={item?.descricao}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                    </div>

                    <div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Tabelas usadas:
                        </label>
                        <Controller
                          name="table_tags"
                          control={control}
                          render={({ field: { value } }) => (
                            <div className="mt-1 flex flex-wrap gap-2">
                              {value?.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-blue-100 text-blue-800"
                                >
                                  {tag}
                                </span>
                              ))}
                              {(!value || value.length === 0) && (
                                <span className="text-gray-500 text-sm">
                                  No table tags
                                </span>
                              )}
                            </div>
                          )}
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Colunas usadas:
                        </label>
                        <Controller
                          name="column_tags"
                          control={control}
                          render={({ field: { value } }) => (
                            <div className="mt-1 flex flex-wrap gap-2">
                              {value?.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-blue-100 text-blue-800"
                                >
                                  {tag}
                                </span>
                              ))}
                              {(!value || value.length === 0) && (
                                <span className="text-gray-500 text-sm">
                                  No column tags
                                </span>
                              )}
                            </div>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Information Dropdowns */}
                  <div className="flex-1 space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Queries
                    </label>
                    {parsedQueries.map((query:string, index:number) => (
                      <div
                        key={index}
                        className="border rounded-md overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => handleExpandInfo(index)}
                          className="w-full px-4 py-2 text-left bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
                        >
                          <span>Query {index + 1}</span>
                          <FontAwesomeIcon
                            icon={
                              expandedInfo === index
                                ? faChevronUp
                                : faChevronDown
                            }
                            className="text-gray-500"
                          />
                        </button>
                        {expandedInfo === index && (
                          <div className="p-4">
                                <textarea
                                  rows={4}
                                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  placeholder={`Enter information ${index + 1}`}
                                  value={query}
                                />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </form>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    voltar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
