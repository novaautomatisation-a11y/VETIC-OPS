// app/rendezvous/page.tsx - Page de gestion des rendez-vous

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { RendezVousWithDetails, Patient, Dentist } from '@/lib/types/database.types'

export default function RendezVousPage() {
  const [rendezVous, setRendezVous] = useState<RendezVousWithDetails[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    patient_id: '',
    dentist_id: '',
    starts_at: '',
    ends_at: '',
    status: 'scheduled' as 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show',
    reason: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)

  // Charger les données au chargement
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Charger les rendez-vous
      const rendezVousRes = await fetch('/api/rendezvous')
      if (rendezVousRes.ok) {
        const rendezVousData = await rendezVousRes.json()
        setRendezVous(rendezVousData.data || [])
      }

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
      const response = await fetch('/api/rendezvous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Réinitialiser le formulaire
        setFormData({
          patient_id: '',
          dentist_id: '',
          starts_at: '',
          ends_at: '',
          status: 'scheduled',
          reason: '',
          notes: ''
        })
        setShowForm(false)
        // Recharger les rendez-vous
        loadData()
        alert('Rendez-vous créé avec succès !')
      } else {
        const error = await response.json()
        alert('Erreur: ' + (error.error || 'Échec de la création'))
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création du rendez-vous')
    } finally {
      setSubmitting(false)
    }
  }

  const sendReminder = async (rendezVousId: string) => {
    setSendingReminder(rendezVousId)

    try {
      const response = await fetch('/api/rendezvous/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rendezVousId }),
      })

      const result = await response.json()

      if (response.ok) {
        alert('SMS de rappel envoyé avec succès !')
        // Recharger les rendez-vous pour mettre à jour l'état reminder_sent
        loadData()
      } else {
        alert('Erreur: ' + (result.error || 'Échec de l\'envoi du SMS'))
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'envoi du SMS de rappel')
    } finally {
      setSendingReminder(null)
    }
  }

  // Fonction pour calculer automatiquement l'heure de fin (1 heure après le début)
  const handleStartsAtChange = (value: string) => {
    setFormData({ ...formData, starts_at: value })

    if (value) {
      const startDate = new Date(value)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // +1 heure
      const endDateStr = endDate.toISOString().slice(0, 16)
      setFormData({ ...formData, starts_at: value, ends_at: endDateStr })
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      confirmed: 'bg-green-500/20 text-green-400 border-green-500/50',
      completed: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/50',
      no_show: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    }

    const labels = {
      scheduled: 'Planifié',
      confirmed: 'Confirmé',
      completed: 'Terminé',
      cancelled: 'Annulé',
      no_show: 'Absent',
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
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
            <h1 className="text-4xl font-bold text-white">Rendez-vous</h1>
            <p className="text-gray-400 mt-2">
              Gérer les rendez-vous et envoyer des rappels SMS
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? 'Annuler' : '+ Ajouter un rendez-vous'}
          </button>
        </div>

        {/* Formulaire d'ajout */}
        {showForm && (
          <div className="card mb-8 animate-slideUp">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Nouveau Rendez-vous
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Patient *
                  </label>
                  <select
                    required
                    className="input-field"
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  >
                    <option value="">-- Sélectionner un patient --</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} ({patient.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dentiste */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dentiste *
                  </label>
                  <select
                    required
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

                {/* Date et heure de début */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date et heure de début *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="input-field"
                    value={formData.starts_at}
                    onChange={(e) => handleStartsAtChange(e.target.value)}
                  />
                </div>

                {/* Date et heure de fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date et heure de fin *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="input-field"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                  />
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Statut
                  </label>
                  <select
                    className="input-field"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="scheduled">Planifié</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                    <option value="no_show">Absent</option>
                  </select>
                </div>

                {/* Raison */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Raison de la visite
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Contrôle annuel, détartrage..."
                    className="input-field"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
                  {submitting ? 'Création en cours...' : 'Créer le rendez-vous'}
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

        {/* Liste des rendez-vous */}
        <div className="card">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Rendez-vous à venir ({rendezVous.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Chargement...
            </div>
          ) : rendezVous.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Aucun rendez-vous enregistré. Ajoutez votre premier rendez-vous ci-dessus.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Date/Heure</th>
                    <th className="table-header-cell">Patient</th>
                    <th className="table-header-cell">Dentiste</th>
                    <th className="table-header-cell">Raison</th>
                    <th className="table-header-cell">Statut</th>
                    <th className="table-header-cell">Rappel SMS</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {rendezVous.map((rdv) => (
                    <tr key={rdv.id} className="hover:bg-dark-card transition-colors">
                      <td className="table-cell font-medium text-white">
                        {new Date(rdv.starts_at).toLocaleString('fr-CH', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="table-cell">
                        {rdv.patient
                          ? `${rdv.patient.first_name} ${rdv.patient.last_name}`
                          : '-'
                        }
                      </td>
                      <td className="table-cell">
                        {rdv.dentist
                          ? `Dr. ${rdv.dentist.first_name} ${rdv.dentist.last_name}`
                          : '-'
                        }
                      </td>
                      <td className="table-cell">{rdv.reason || '-'}</td>
                      <td className="table-cell">{getStatusBadge(rdv.status)}</td>
                      <td className="table-cell">
                        {rdv.reminder_sent ? (
                          <span className="text-green-400">✓ Envoyé</span>
                        ) : (
                          <span className="text-gray-500">Non envoyé</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => sendReminder(rdv.id)}
                          disabled={rdv.reminder_sent || sendingReminder === rdv.id}
                          className="text-primary-400 hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {sendingReminder === rdv.id ? 'Envoi...' : '📱 Envoyer SMS'}
                        </button>
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
