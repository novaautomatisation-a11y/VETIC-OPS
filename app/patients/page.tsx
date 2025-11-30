// app/patients/page.tsx - Page de gestion des patients

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { PatientWithDentist, Dentist } from '@/lib/types/database.types'

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientWithDentist[]>([])
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    postal_code: '',
    dentist_id: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Charger les patients et dentistes au chargement
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Charger les patients
      const patientsRes = await fetch('/api/patients')
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json()
        setPatients(patientsData.data || [])
      }

      // Charger les dentistes
      const dentistsRes = await fetch('/api/dentists')
      if (dentistsRes.ok) {
        const dentistsData = await dentistsRes.json()
        setDentists(dentistsData.data || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Réinitialiser le formulaire
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          date_of_birth: '',
          address: '',
          city: '',
          postal_code: '',
          dentist_id: '',
          notes: ''
        })
        setShowForm(false)
        // Recharger les patients
        loadData()
        alert('Patient ajouté avec succès !')
      } else {
        const error = await response.json()
        alert('Erreur: ' + (error.error || 'Échec de l\'ajout'))
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'ajout du patient')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-primary-400 hover:text-primary-300 mb-2 inline-block">
              ← Retour au dashboard
            </Link>
            <h1 className="text-4xl font-bold text-white">Patients</h1>
            <p className="text-gray-400 mt-2">
              Gérer les patients du cabinet
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? 'Annuler' : '+ Ajouter un patient'}
          </button>
        </div>

        {/* Formulaire d'ajout */}
        {showForm && (
          <div className="card mb-8 animate-slideUp">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Nouveau Patient
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prénom */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+41 79 123 45 67"
                    className="input-field"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                {/* Date de naissance */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>

                {/* Dentiste */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dentiste assigné
                  </label>
                  <select
                    className="input-field"
                    value={formData.dentist_id}
                    onChange={(e) => setFormData({ ...formData, dentist_id: e.target.value })}
                  >
                    <option value="">-- Sélectionner un dentiste --</option>
                    {dentists.map((dentist) => (
                      <option key={dentist.id} value={dentist.id}>
                        Dr. {dentist.first_name} {dentist.last_name}
                        {dentist.specialization && ` (${dentist.specialization})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Adresse */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {/* Ville */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                {/* Code postal */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Code postal
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  rows={3}
                  className="input-field"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Ajout en cours...' : 'Ajouter le patient'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des patients */}
        <div className="card">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Liste des patients ({patients.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Chargement...
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Aucun patient enregistré. Ajoutez votre premier patient ci-dessus.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Nom complet</th>
                    <th className="table-header-cell">Téléphone</th>
                    <th className="table-header-cell">Email</th>
                    <th className="table-header-cell">Dentiste</th>
                    <th className="table-header-cell">Ville</th>
                    <th className="table-header-cell">Date d'ajout</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-dark-card transition-colors">
                      <td className="table-cell font-medium text-white">
                        {patient.first_name} {patient.last_name}
                      </td>
                      <td className="table-cell">{patient.phone}</td>
                      <td className="table-cell">{patient.email || '-'}</td>
                      <td className="table-cell">
                        {patient.dentist
                          ? `Dr. ${patient.dentist.first_name} ${patient.dentist.last_name}`
                          : '-'
                        }
                      </td>
                      <td className="table-cell">{patient.city || '-'}</td>
                      <td className="table-cell">
                        {new Date(patient.created_at).toLocaleDateString('fr-CH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
