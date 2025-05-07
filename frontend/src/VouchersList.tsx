import React, { useState, useEffect } from "react";
import { fetchVouchers, updateToken } from "./api";
import { jwtDecode, JwtPayload } from "jwt-decode";

// Define the Voucher interface based on the JSON structure
interface Campaign {
  promoDescription: string;
  promoShortDescription: string;
  startsAt: string;
  endsAt: string;
}
interface Metadata {
  listUuid: string;
}

interface Voucher {
  id: string;
  status: string;
  campaign: Campaign;
  metadata: Metadata;
}

const VouchersList: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [refreshToken, setRefreshToken] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [initialize, setInitialize] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showGoodDealsOnly, setShowGoodDealsOnly] = useState<boolean>(false);
  const [tokenDate, setTokenDate] = useState<Date | null>(null);
  const [minutesDiff, setMinutesDiff] = useState<number>(0);

  // Replace with your actual bearer token

  const getVouchers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchVouchers("");
      setVouchers(response);
      filterVouchers(response, showGoodDealsOnly);
    } catch (err) {
      setError("Failed to fetch vouchers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to parse currency value from strings like "R$14" or "R$ 20"
  const parseCurrencyValue = (text: string): number | null => {
    const match = text.match(/R\$\s*(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  // Function to parse minimum order value from strings like "acima de R$120"
  const parseMinimumValue = (text: string): number | null => {
    const match = text.match(/R\$\s*(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  // Check if a voucher has percentage discount
  const hasPercentageDiscount = (promoDescription: string): boolean => {
    return promoDescription.includes("%");
  };

  // Check if a deal is "good" based on criteria
  const isGoodDeal = (voucher: Voucher): boolean => {
    const { promoDescription, promoShortDescription } = voucher.campaign;

    // If it has a percentage discount, it's a good deal
    if (hasPercentageDiscount(promoDescription)) {
      return true;
    }

    // Parse discount amount and minimum order value
    const discountAmount = parseCurrencyValue(promoDescription);
    const minimumOrderValue = parseMinimumValue(promoShortDescription);

    // If we can't parse either value, consider it a good deal to be safe
    if (discountAmount === null || minimumOrderValue === null) {
      return true;
    }

    // It's a good deal if the difference is less than R$20
    const difference = minimumOrderValue - discountAmount;
    console.log(minimumOrderValue, discountAmount);
    return difference < 7;
  };

  const filterVouchers = (voucherList: Voucher[], filterGoodDeals: boolean) => {
    if (filterGoodDeals) {
      const goodDeals = voucherList.filter((voucher) => isGoodDeal(voucher));
      setFilteredVouchers(goodDeals);
    } else {
      setFilteredVouchers(voucherList);
    }
  };

  const uniqueVouchers: Voucher[] = filteredVouchers.reduce(
    (acc: Voucher[], voucher: Voucher) => {
      if (!acc.some((v) => v.metadata.listUuid === voucher.metadata.listUuid)) {
        acc.push(voucher);
      }
      return acc;
    },
    []
  );
  const handleUpdateToken = async () => {
    const accessToken = await updateToken();
    localStorage.setItem("access_token", accessToken); // Save token to localStorage
    const date = getTokenDateFromJWT() || null;
    setTokenDate(date);
  };

  const getTokenDateFromJWT = (): Date | null => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded: JwtPayload = jwtDecode(token);
        if (decoded.iat) {
          return new Date(decoded.iat * 1000);
        }
      } catch (error) {
        console.error("Invalid token");
      }
    }
    return null;
  };

  useEffect(() => {
    if (initialize) {
      const date = getTokenDateFromJWT() || null;
      setRefreshToken(localStorage.getItem("refresh_token") || "");
      setTokenDate(date);
      setInitialize(false);
    }
  }, [initialize]);

  useEffect(() => {
    if (tokenDate) {
      const calculateMinutesDiff = () => {
        const now = new Date();
        const diffMs = tokenDate.getTime() - now.getTime();
        setMinutesDiff(Math.floor(diffMs / (1000 * 60)));
      };

      calculateMinutesDiff();
      const interval = setInterval(calculateMinutesDiff, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [tokenDate]);

  useEffect(() => {
    filterVouchers(vouchers, showGoodDealsOnly);
  }, [showGoodDealsOnly, vouchers]);

  return (
    <div className="p-4">
      <div className="mb-4 flex grid grid-cols-3">
        <div>
          <button
            onClick={getVouchers}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Search
          </button>
          <button
            onClick={handleUpdateToken}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            update token
          </button>
          <button
            onClick={() => {
              const getTokenDateFromJWT = () => {
                const token = localStorage.getItem("access_token");
                if (token) {
                  try {
                    const decoded: JwtPayload = jwtDecode(token);
                    if (decoded.iat) {
                      return new Date(decoded.iat * 1000);
                    }
                  } catch (error) {
                    console.error("Invalid token");
                  }
                }
                return null;
              };
              console.log(getTokenDateFromJWT());
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            test
          </button>
        </div>

        <div className="w-full flex items-center">
          <div className="ml-3 text-gray-700 font-medium">
            <div>Token Date: {tokenDate?.toLocaleString()}</div>
          </div>
          <div className="ml-3 text-gray-700 font-medium">
            <div>Remaining: {minutesDiff + 120}mins</div>
          </div>
        </div>
        <div className="w-full flex items-center">
          <input
            className=" rounded mx-2"
            value={refreshToken}
            onChange={(e) => {
              setRefreshToken(e.target.value);
            }}
          />
          <button
            onClick={() => {
              localStorage.setItem("refresh_token", refreshToken);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            set Refresh Token
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={showGoodDealsOnly}
              onChange={() => setShowGoodDealsOnly(!showGoodDealsOnly)}
            />
            <div
              className={`block w-14 h-8 rounded-full ${
                showGoodDealsOnly ? "bg-green-400" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                showGoodDealsOnly ? "transform translate-x-6" : ""
              }`}
            ></div>
          </div>
          <div className="ml-3 text-gray-700 font-medium">
            Show Good Deals Only
          </div>
        </label>
        <div className="ml-4 text-sm text-gray-500">
          (Percentage discounts or deals with less than R$20 difference)
        </div>
      </div>

      {loading && <p>Loading vouchers...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid gap-4">
        {uniqueVouchers.map((voucher) => (
          <div
            key={voucher.id}
            className={`border p-4 rounded shadow-md ${
              hasPercentageDiscount(voucher.campaign.promoDescription)
                ? "border-green-500"
                : isGoodDeal(voucher)
                ? "border-blue-500"
                : "border-red-500"
            }`}
          >
            <div className="flex justify-between">
              <h3 className="font-bold text-lg">
                {voucher.campaign.promoDescription}
              </h3>
              <span
                className={`text-sm font-semibold px-2 py-1 rounded ${
                  hasPercentageDiscount(voucher.campaign.promoDescription)
                    ? "bg-green-100 text-green-800"
                    : isGoodDeal(voucher)
                    ? "bg-blue-100 text-blue-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {hasPercentageDiscount(voucher.campaign.promoDescription)
                  ? "Percentage"
                  : isGoodDeal(voucher)
                  ? "Good Deal"
                  : "Bad Deal"}
              </span>
            </div>
            <p className="text-gray-600 mt-2">
              {voucher.campaign.promoShortDescription}
            </p>
            <div className="mt-2 text-sm text-gray-500">
              <p>Status: {voucher.status}</p>
              <p>
                Valid from:{" "}
                {new Date(voucher.campaign.startsAt).toLocaleDateString()}
              </p>
              <p>
                Valid until:{" "}
                {new Date(voucher.campaign.endsAt).toLocaleDateString()}
              </p>
              <p>UUID: {voucher.metadata.listUuid}</p>
            </div>
            <button
              className="bg-red-400 text-white mt-2 px-2 py-1 rounded"
              onClick={() =>
                window.open(
                  "https://www.ifood.com.br/delivery/descobrir/restaurantes-com-cupom/" +
                    voucher.metadata.listUuid,
                  "_blank"
                )
              }
            >
              {" "}
              Check stores
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VouchersList;
