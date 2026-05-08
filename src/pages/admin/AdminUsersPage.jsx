import { useCallback, useEffect, useState } from 'react'
import { blockUser, deleteUser, getUsers, unblockUser } from '../../services/userService'
import AdminLayout from './AdminLayout'
import AdminTable from './AdminTable'
import { formatDate, getApiErrorMessage, valueOrDash } from './adminUtils'

function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionUserId, setActionUserId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadUsers = useCallback((shouldUpdate = () => true) => {
    setIsLoading(true)
    setError('')

    return getUsers()
      .then((data) => {
        if (shouldUpdate()) {
          setUsers(data)
        }
      })
      .catch((apiError) => {
        if (shouldUpdate()) {
          setError(getApiErrorMessage(apiError))
        }
      })
      .finally(() => {
        if (shouldUpdate()) {
          setIsLoading(false)
        }
      })
  }, [])

  useEffect(() => {
    let isMounted = true

    getUsers()
      .then((data) => {
        if (isMounted) {
          setUsers(data)
        }
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(getApiErrorMessage(apiError))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const runUserAction = (user, action, successMessage) => {
    const token = localStorage.getItem('ahifambe_token')

    if (!token) {
      setError('Sessao expirada. Faz login novamente para executar esta accao.')
      setSuccess('')
      return
    }

    setActionUserId(user.id)
    setError('')
    setSuccess('')

    action(user.id)
      .then((result) => {
        setSuccess(result?.message || successMessage)
        return loadUsers()
      })
      .catch((apiError) => {
        setError(getApiErrorMessage(apiError))
      })
      .finally(() => {
        setActionUserId(null)
      })
  }

  const handleDelete = (user) => {
    const confirmed = window.confirm(`Apagar o utilizador ${user.name || user.email}?`)

    if (!confirmed) {
      return
    }

    runUserAction(user, deleteUser, 'Utilizador apagado com sucesso.')
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome', render: (user) => valueOrDash(user.name) },
    { key: 'email', label: 'Email', render: (user) => valueOrDash(user.email) },
    { key: 'role', label: 'Perfil', render: (user) => valueOrDash(user.role) },
    { key: 'status', label: 'Estado', render: (user) => valueOrDash(user.status || 'active') },
    { key: 'created_at', label: 'Criado em', render: (user) => formatDate(user.created_at) },
    {
      key: 'actions',
      label: 'Accoes',
      render: (user) => {
        const isBusy = actionUserId === user.id
        const status = user.status || 'active'

        return (
          <div className="admin-table-actions">
            {status === 'active' ? (
              <button
                className="button button-small"
                disabled={isBusy}
                onClick={() => runUserAction(user, blockUser, 'Utilizador bloqueado com sucesso.')}
                type="button"
              >
                Bloquear
              </button>
            ) : null}
            {status === 'blocked' ? (
              <button
                className="button button-small"
                disabled={isBusy}
                onClick={() =>
                  runUserAction(user, unblockUser, 'Utilizador desbloqueado com sucesso.')
                }
                type="button"
              >
                Desbloquear
              </button>
            ) : null}
            <button
              className="button button-small button-danger"
              disabled={isBusy}
              onClick={() => handleDelete(user)}
              type="button"
            >
              Apagar
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <AdminLayout
      eyebrow="Gestao"
      title="Utilizadores"
      description="Lista carregada de GET /api/users."
    >
      {isLoading ? <div className="admin-state">A carregar utilizadores...</div> : null}
      {success ? <div className="admin-success">{success}</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {!isLoading && !error ? (
        <AdminTable columns={columns} data={users} emptyMessage="Nenhum utilizador encontrado." />
      ) : null}
    </AdminLayout>
  )
}

export default AdminUsersPage
