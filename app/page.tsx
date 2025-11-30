// app/page.tsx - Dashboard principal VETIC OPS

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            VETIC OPS
          </h1>
          <p className="text-gray-400">
            Système de gestion pour cabinets dentaires et médicaux
          </p>
        </header>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card Patients */}
          <Link href="/patients">
            <div className="card-hover cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-400 rounded-lg flex items-center justify-center text-2xl">
                  👥
                </div>
                <h2 className="ml-4 text-xl font-semibold text-white">
                  Patients
                </h2>
              </div>
              <p className="text-gray-400">
                Gérer les patients du cabinet
              </p>
            </div>
          </Link>

          {/* Card Rendez-vous */}
          <Link href="/rendezvous">
            <div className="card-hover cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-400 rounded-lg flex items-center justify-center text-2xl">
                  📅
                </div>
                <h2 className="ml-4 text-xl font-semibold text-white">
                  Rendez-vous
                </h2>
              </div>
              <p className="text-gray-400">
                Gérer les rendez-vous et envoyer des rappels SMS
              </p>
            </div>
          </Link>

          {/* Card Dentistes */}
          <div className="card-hover cursor-pointer opacity-50">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center text-2xl">
                🦷
              </div>
              <h2 className="ml-4 text-xl font-semibold text-white">
                Dentistes
              </h2>
            </div>
            <p className="text-gray-400">
              Bientôt disponible
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="card">
            <h3 className="text-sm text-gray-400 mb-2">Total Patients</h3>
            <p className="text-3xl font-bold text-white">-</p>
          </div>
          <div className="card">
            <h3 className="text-sm text-gray-400 mb-2">Rendez-vous aujourd'hui</h3>
            <p className="text-3xl font-bold text-white">-</p>
          </div>
          <div className="card">
            <h3 className="text-sm text-gray-400 mb-2">SMS envoyés ce mois</h3>
            <p className="text-3xl font-bold text-white">-</p>
          </div>
        </div>
      </div>
    </div>
  )
}
