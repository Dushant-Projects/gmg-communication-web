import Image from "next/image";

export type PaymentSetting = {
  method: string; display_name: string; account_title: string | null;
  account_number: string | null; iban: string | null; qr_image_url: string | null; instructions: string | null;
};

export function PaymentInstructions({ setting }: { setting: PaymentSetting }) {
  const hasDetails = setting.account_title || setting.account_number || setting.iban;
  return (
    <div className="rounded-2xl bg-mist p-4 text-sm">
      <p className="font-bold">{setting.display_name} details</p>
      {hasDetails ? (
        <div className="mt-1 space-y-0.5">
          {setting.account_title && <p>{setting.account_title}</p>}
          {setting.account_number && <p>{setting.method === "bank_transfer" ? "Account" : "Number"}: {setting.account_number}</p>}
          {setting.iban && <p>IBAN: {setting.iban}</p>}
        </div>
      ) : (
        <p className="mt-1 text-muted">Account details will be shared with you shortly.</p>
      )}
      {setting.qr_image_url && (
        <div className="relative mt-3 h-36 w-36 overflow-hidden rounded-xl border border-line bg-white">
          <Image src={setting.qr_image_url} alt={`${setting.display_name} QR code`} fill sizes="144px" className="object-contain" />
        </div>
      )}
      <p className="mt-2 text-muted">{setting.instructions || "Pay the total amount, then upload your payment screenshot."}</p>
    </div>
  );
}
