import PBFTSimulator from '../components/PBFTSimulator'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold mb-8">PBFT Simulator</h1>
      <PBFTSimulator />
    </main>
  )
}