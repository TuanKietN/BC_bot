import { EMessageComponentType } from "mezon-sdk";

export const BauCuaSelect = {
   type: EMessageComponentType.SELECT,
   id: "BauCuaSelect", // tên id để handle event
   component: {
      placeholder: "Chọn cửa cược",
      options: [
         { label: "🎃 Bầu", value: "1" },
         { label: "🦀 Cua", value: "2" },
         { label: "🐔 Gà", value: "3" },
         { label: "🦌 Nai", value: "4" },
         { label: "🦐 Tôm", value: "5" },
         { label: "🐟 Cá", value: "6" },
      ],
      required: true,
      valueSelected: null,
   },
};
