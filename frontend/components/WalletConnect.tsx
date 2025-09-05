// "use client";

// import { ConnectKitButton } from "connectkit";
// import { Button } from "@/components/ui/button";
// import { Wallet, User } from "lucide-react";

// export function WalletConnect() {
//   return (
//     <ConnectKitButton.Custom>
//       {({ isConnecting, show, address, ensName, isConnected }) => {
//         if (isConnected) {
//           return (
//             <div className="flex items-center gap-2">
//               <span className="text-sm font-medium">
//                 {ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
//               </span>
//               <ConnectKitButton />
//             </div>
//           );
//         }
        
//         return (
//           <Button onClick={show} disabled={isConnecting}>
//             <Wallet className="w-4 h-4 mr-2" />
//             {isConnecting ? "Connecting..." : "Connect Wallet"}
//           </Button>
//         );
//       }}
//     </ConnectKitButton.Custom>
//   );
// }
