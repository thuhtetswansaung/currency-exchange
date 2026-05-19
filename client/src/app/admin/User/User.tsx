import { useState } from "react";
import useDebounce from "../../../hooks/useDebounce";
import { useUser } from "./hook/useUser";
import { useNavigate } from "react-router-dom";
import { MdArchive, MdArrowBack, MdDelete, MdEdit, MdKey, MdRestore, MdSearch } from "react-icons/md";
import UserTable from "./components/UserTable";
import { useSelector } from "react-redux";
import type { RootState } from "../../../slices/store/store";
import { useUserControl } from "./hook/useUserControl";
import UpdateUser from "./components/UpdateUser";
import type { User } from "../../../slices/interfaces/user";
import ChangePassword from "./components/ChangePassword";
import AddUser from "./components/AddUser";

const User = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { addUser, archiveUser, restoreUser, deleteUserAction, updateUser, changePasswrod } = useUserControl()
  const [passwordUser, setPasswordUser] = useState<User | null>(null)
  const [openAddUser, setOpenAddUser] = useState(false)

  const debounce = useDebounce(search);
  const limit = 10;

  const navigate = useNavigate();
  const userInfo = useSelector((state: RootState) => state.auth.userInfo)
  const isSuperAdmin = userInfo?.role === 'super_admin'

  const { users, usersPagination, isLoading } = useUser({
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy: "createdAt",
    order: "desc",
    search: debounce,
    isActive: tab === 'active'
  });

  if (isLoading) {
    return (
      <div className="text-[var(--text-primary)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-10">

      {/* Header */}
      <section className="py-6 flex flex-col xl:flex-row xl:items-end justify-between gap-6">

        {/* Left */}
        <div className="space-y-4">

          <button onClick={() => navigate("/admin/dashboard")} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
            <MdArrowBack className="text-lg" />
            Back
          </button>

          <button
            onClick={() => setOpenAddUser(true)}
            className="group relative flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold transition-all duration-300 hover:bg-white/10 hover:border-[#8affec]/40 hover:shadow-[0_0_20px_rgba(138,255,236,0.15)] active:scale-95">
            <span className="text-[#8affec] text-lg group-hover:rotate-90 transition-transform duration-300">
              +
            </span>
            Add User
          </button>

          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tight text-[var(--primary)]">
              Users
            </h2>

            <p className="text-[var(--text-secondary)] max-w-md">
              Manage administrative access, user activity and permissions across the platform.
            </p>
          </div>

        </div>

        {/* Right */}
        <div className="flex flex-col sm:flex-row items-center gap-4">

          {/* Search */}
          <div className="relative w-full sm:w-72 group">

            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search users..."
              className="w-full bg-[var(--surface-container)] rounded-2xl py-3 pl-11 pr-4 text-sm text-white border border-[#38476d]/20 outline-none"
            />

            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-xl" />

          </div>

          {/* Tabs */}
          <div className="flex bg-[#0f172a]/60 p-1.5 rounded-2xl border border-[#38476d]/50 backdrop-blur-md">

            <button
              onClick={() => {
                setTab("active");
                setPage(1);
              }}
              className={`px-8 py-2.5 rounded-xl text-sm transition-all duration-300 ${tab === "active" ? "bg-[#8affec] text-black font-black shadow-[0_0_20px_rgba(138,255,236,0.3)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              Active
            </button>

            <button
              onClick={() => {
                setTab("archived");
                setPage(1);
              }}
              className={`px-8 py-2.5 rounded-xl text-sm transition-all duration-300 ${tab === "archived" ? "bg-[#ff716c] text-white font-black shadow-[0_0_20px_rgba(255,113,108,0.3)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              Archived
            </button>

          </div>

        </div>

      </section>

      {/* Table */}
      <UserTable
        data={users}
        column={[
          {
            header: "User Profile",
            render: (t) => (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--surface-container-high)] ring-2 ring-[var(--outline-variant)]/20 flex items-center justify-center text-[var(--secondary)] font-bold">
                    {t.name?.charAt(0).toUpperCase()}
                  </div>

                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-[var(--surface-container-highest)] ${t.isActive ? "bg-[var(--tertiary)] active-glow" : "bg-[var(--error)]"}`} />
                </div>

                <div>
                  <p className="font-bold text-[var(--primary)]">{t.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{t.email}</p>
                </div>
              </div>
            ),
          },

          {
            header: "Role",
            render: (t) => (
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${t.role === "admin" ? "bg-[var(--surface-container-high)] border border-[var(--tertiary)]/20 text-[var(--tertiary)]" : "bg-gradient-to-br from-[var(--secondary-container)] to-[var(--secondary-dim)]/40 border border-[var(--secondary)]/20 text-[var(--secondary)]"}`}>
                {t.role}
              </span>
            ),
          },

          {
            header: "Status",
            render: (t) => (
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${t.isActive ? "bg-[var(--tertiary)] active-glow" : "bg-[var(--error)]"}`} />

                <span className={`text-sm font-bold ${t.isActive ? "text-[var(--tertiary)]" : "text-[var(--error)]"}`}>
                  {t.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ),
          },

          {
            header: "Created At",
            render: (t) => (
              <div>
                <p className="text-sm text-white">
                  {new Date(t.createdAt).toLocaleDateString()}
                </p>

                <p className="text-[10px] text-[var(--text-secondary)] uppercase">
                  {new Date(t.createdAt).toLocaleTimeString()}
                </p>
              </div>
            ),
          },

          {
            header: "Actions",
            className: "w-[180px] text-right",
            render: (t) => (
              <div className="w-full flex items-center justify-end gap-2">

                {isSuperAdmin && tab === "active" && (
                  <>
                    {/* Change Password */}
                    <button
                      title="Change Password"
                      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-[var(--surface-bright)]/30 transition-all duration-300 hover:scale-105 text-[var(--secondary)] hover:bg-[var(--secondary)]/20`}
                      onClick={() => setPasswordUser(t)}
                    >
                      <MdKey size={16} />
                    </button>

                    {/* Update */}
                    <button
                      title="Update"
                      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-[var(--surface-bright)]/30 transition-all duration-300 hover:scale-105 text-white hover:bg-[var(--tertiary)]/20 hover:text-[var(--tertiary)]`}
                      onClick={() => setSelectedUser(t)}
                    >
                      <MdEdit size={16} />
                    </button>

                    {/* Archive */}
                    <button
                      title="Archive"
                      className={`$w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-[var(--surface-bright)]/30 transition-all duration-300 hover:scale-105 text-[var(--error)] hover:bg-[var(--error)]/20`}
                      onClick={() => archiveUser(t._id)}
                    >
                      <MdArchive size={16} />
                    </button>
                  </>
                )}

                {isSuperAdmin && tab === "archived" && (
                  <>
                    {/* Restore */}
                    <button
                      title="Restore"
                      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-[var(--surface-bright)]/30 transition-all duration-300 hover:scale-105 text-green-400 hover:bg-green-500/20`}
                      onClick={() => restoreUser(t._id)}
                    >
                      <MdRestore size={16} />
                    </button>

                    {/* Delete permanently */}
                    <button
                      title="Delete Permanently"
                      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-[var(--surface-bright)]/30 transition-all duration-300 hover:scale-105 text-red-400 hover:bg-red-500/20`}
                      onClick={() => deleteUserAction(t._id)}
                    >
                      <MdDelete size={16} />
                    </button>
                  </>
                )}

              </div>
            ),
          }
        ]}
      />

      {/* Pagination */}
      <footer className="mt-12 flex justify-between py-8 border-t border-white/5">

        <p className="text-[var(--text-secondary)]">
          Page {usersPagination?.page || 1} / {usersPagination?.totalPages || 1}
        </p>

        <div className="flex gap-3">

          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="px-4 py-2 rounded-lg bg-[var(--surface-container)] text-[var(--text-primary)] disabled:opacity-40">
            Previous
          </button>

          <button
            disabled={page === usersPagination?.totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="px-4 py-2 rounded-lg bg-[var(--secondary)] text-black font-medium disabled:opacity-40">
            Next
          </button>

        </div>

      </footer>

      {selectedUser && (
        <UpdateUser
          open={!!selectedUser}
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onEdit={updateUser}
        />
      )}

      {passwordUser && (
        <ChangePassword
          open={!!passwordUser}
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
          onSubmit={changePasswrod}
        />
      )}

      <AddUser
        open={openAddUser}
        onClose={() => setOpenAddUser(false)}
        onSubmit={addUser}
      />

    </div>
  );
};

export default User;