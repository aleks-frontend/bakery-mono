import { useTranslation } from "react-i18next";
import { useArticlesQuery } from "@/hooks/useArticlesQuery";
import { LanguageSelector } from "@/components/LanguageSelector";
import { OrderStatusBanner } from "@/components/OrderStatusBanner";
import { OrderForm } from "@/components/OrderForm";
import { Spinner } from "@/components/Spinner";

function App() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useArticlesQuery();

  const acceptingOrders = data?.acceptingOrders ?? false;
  const articles = (data?.articles ?? []).filter((a) => a.available);

  return (
    <>
      <header className="max-w-[720px] mx-auto mb-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Bakery Logo"
              className="max-w-[50px] max-h-[50px] w-auto h-auto object-contain drop-shadow-[0_4px_8px_rgba(198,134,66,0.3)] hover:drop-shadow-[0_6px_12px_rgba(198,134,66,0.4)] transition-all duration-300"
            />
            <div className="flex flex-col text-left">
              <span className="text-[16px] font-bold uppercase">
                LISZT: RAPSZÓDIA
              </span>
              <span className="text-[12px]">{t("Hleb / Pastry / Pizza")}</span>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {isError ? (
        <div className="max-w-[720px] mx-auto my-6 bg-red-50 border-2 border-red-400 rounded-xl py-5 px-6 text-red-900 text-center">
          {t("Something went wrong loading the order form. Please try again in a moment.")}
        </div>
      ) : (
        <OrderStatusBanner
          show={!isLoading && !acceptingOrders}
          reopenDate={data?.reopenDate ?? undefined}
          holidayMessage={data?.holidayMessage ?? undefined}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Spinner />
        </div>
      ) : !isError ? (
        <OrderForm articles={articles} acceptingOrders={acceptingOrders} />
      ) : null}
    </>
  );
}

export default App;
