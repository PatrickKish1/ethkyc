// "use client"

// import { UniKycButton, UniKycProvider, createUniKycConfig } from '@unikyc/sdk'
// import { useState } from 'react'

// const config = createUniKycConfig({
//   baseUrl: 'http://localhost:3000', // Point to your deployed UniKYC app
//   chains: {
//     baseSepolia: 'https://sepolia.base.org',
//     polygon: 'https://polygon-rpc.com'
//   },
//   theme: {
//     primaryColor: '#3b82f6',
//     borderRadius: '0.5rem'
//   }
// })

// export default function ExampleApp() {
//   const [walletAddress, setWalletAddress] = useState('0x742d35Cc6635C0532925a3b8D8C9C61c6a0c5c8B')
//   const [ensName, setEnsName] = useState('vitalik.eth')
//   const [activeTab, setActiveTab] = useState<'wallet' | 'ens'>('wallet')

//   const handleSuccess = (result: any) => {
//     console.log('KYC Success:', result)
//     alert(`KYC verification successful! Status: ${result.status.status}`)
//   }

//   const handleError = (error: string) => {
//     console.error('KYC Error:', error)
//     alert(`KYC verification failed: ${error}`)
//   }

//   return (
//     <UniKycProvider config={config}>
//       <div className="min-h-screen bg-gray-50 py-12 px-4">
//         <div className="max-w-4xl mx-auto">
//           <div className="text-center mb-12">
//             <h1 className="text-4xl font-bold text-gray-900 mb-4">
//               UniKYC SDK Example
//             </h1>
//             <p className="text-xl text-gray-600">
//               Integrate decentralized KYC verification into your app
//             </p>
//           </div>

//           <div className="grid md:grid-cols-2 gap-8">
//             {/* Basic Button Example */}
//             <div className="bg-white rounded-lg shadow-lg p-6">
//               <h2 className="text-2xl font-semibold mb-4">Basic Button</h2>
//               <p className="text-gray-600 mb-6">
//                 Simple KYC verification button for wallet addresses
//               </p>
              
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Wallet Address
//                   </label>
//                   <input
//                     type="text"
//                     value={walletAddress}
//                     onChange={(e) => setWalletAddress(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="0x..."
//                   />
//                 </div>
                
//                 <UniKycButton
//                   config={config}
//                   identifier={walletAddress}
//                   onSuccess={handleSuccess}
//                   onError={handleError}
//                   buttonText="Verify Wallet KYC"
//                 />
//               </div>
//             </div>

//             {/* Card Example */}
//             <div className="bg-white rounded-lg shadow-lg p-6">
//               <h2 className="text-2xl font-semibold mb-4">Status Card</h2>
//               <p className="text-gray-600 mb-6">
//                 Detailed KYC status card with ENS support
//               </p>
              
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     ENS Name
//                   </label>
//                   <input
//                     type="text"
//                     value={ensName}
//                     onChange={(e) => setEnsName(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="vitalik.eth"
//                   />
//                 </div>
                
//                 <UniKycButton
//                   config={config}
//                   identifier={ensName}
//                   onSuccess={handleSuccess}
//                   onError={handleError}
//                   showCard={true}
//                 />
//               </div>
//             </div>

//             {/* Different Variants */}
//             <div className="bg-white rounded-lg shadow-lg p-6">
//               <h2 className="text-2xl font-semibold mb-4">Button Variants</h2>
//               <p className="text-gray-600 mb-6">
//                 Different button styles and sizes
//               </p>
              
//               <div className="space-y-4">
//                 <div className="flex flex-wrap gap-2">
//                   <UniKycButton
//                     config={config}
//                     identifier={walletAddress}
//                     variant="default"
//                     size="sm"
//                     buttonText="Default"
//                     onSuccess={handleSuccess}
//                     onError={handleError}
//                   />
//                   <UniKycButton
//                     config={config}
//                     identifier={walletAddress}
//                     variant="outline"
//                     size="sm"
//                     buttonText="Outline"
//                     onSuccess={handleSuccess}
//                     onError={handleError}
//                   />
//                   <UniKycButton
//                     config={config}
//                     identifier={walletAddress}
//                     variant="secondary"
//                     size="sm"
//                     buttonText="Secondary"
//                     onSuccess={handleSuccess}
//                     onError={handleError}
//                   />
//                 </div>
                
//                 <UniKycButton
//                   config={config}
//                   identifier={walletAddress}
//                   size="lg"
//                   buttonText="Large Button"
//                   onSuccess={handleSuccess}
//                   onError={handleError}
//                 />
//               </div>
//             </div>

//             {/* Integration Guide */}
//             <div className="bg-white rounded-lg shadow-lg p-6">
//               <h2 className="text-2xl font-semibold mb-4">Integration Guide</h2>
//               <div className="prose text-sm">
//                 <h3 className="text-lg font-semibold">1. Install SDK</h3>
//                 <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
// npm install @unikyc/sdk
//                 </pre>
                
//                 <h3 className="text-lg font-semibold mt-4">2. Import Components</h3>
//                 <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
// {`import { UniKycButton, createUniKycConfig } from '@unikyc/sdk'`}
//                 </pre>
                
//                 <h3 className="text-lg font-semibold mt-4">3. Configure</h3>
//                 <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
// {`const config = createUniKycConfig({
//   baseUrl: 'https://your-unikyc-app.vercel.app'
// })`}
//                 </pre>
                
//                 <h3 className="text-lg font-semibold mt-4">4. Use Component</h3>
//                 <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
// {`<UniKycButton
//   config={config}
//   identifier="0x..."
//   onSuccess={(result) => console.log(result)}
// />`}
//                 </pre>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </UniKycProvider>
//   )
// }
