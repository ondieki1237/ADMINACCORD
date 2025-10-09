"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  sales?: number;
  target?: number;
}

interface Sale {
  _id: string;
  userId: {
    _id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  equipment: string;
  price: number;
  target: number;
  createdAt: string;
}

export default function UserManager({ onBack }: { onBack?: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("role");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"target" | "sales" | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inputValue, setInputValue] = useState<number>(0);
  const [equipment, setEquipment] = useState<string>("");
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Sales data
  const [sales, setSales] = useState<Sale[]>([]);

  // For inline target editing
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [newTargetValue, setNewTargetValue] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    // Fetch users
    fetch("https://accordbackend.onrender.com/api/users", {
      headers: {
        Authorization: token ? `Bearer ${token}` : ""
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setUsers(data.data);
        } else {
          setError("Failed to load users");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching users");
        setLoading(false);
      });

    // Fetch all sales
    fetch("https://accordbackend.onrender.com/api/sales", {
      headers: {
        Authorization: token ? `Bearer ${token}` : ""
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setSales(data.data);
        }
      });
  }, []);

  // Inline target save
  const handleInlineTargetSave = async (user: User) => {
    const token = localStorage.getItem("accessToken");
    const body = {
      userId: user._id,
      target: newTargetValue,
    };
    try {
      const res = await fetch("https://accordbackend.onrender.com/api/sales/target", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === user._id ? { ...u, target: newTargetValue } : u
          )
        );
      } else {
        alert("Failed to set target.");
      }
    } catch {
      alert("Error setting target.");
    }
    setEditingTargetId(null);
  };

  // Save modal input
  const handleSave = async () => {
    if (!selectedUser) return;
    const token = localStorage.getItem("accessToken");

    if (modalType === "target") {
      // Save target using /api/sales/target
      const body = {
        userId: selectedUser._id,
        target: inputValue,
      };
      try {
        const res = await fetch("https://accordbackend.onrender.com/api/sales/target", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : ""
          },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data.success) {
          setUsers((prev) =>
            prev.map((u) =>
              u._id === selectedUser._id ? { ...u, target: inputValue } : u
            )
          );
        } else {
          alert("Failed to update target.");
        }
      } catch {
        alert("Error updating target.");
      }
    } else if (modalType === "sales") {
      // Add sales, use current target (from user) or null
      const userTarget =
        users.find((u) => u._id === selectedUser._id)?.target ?? null;
      const body = {
        userId: selectedUser._id,
        equipment: equipment,
        price: inputValue,
        target: userTarget,
      };

      try {
        const res = await fetch("https://accordbackend.onrender.com/api/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : ""
          },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data.success) {
          // Optionally, you can refetch sales here or push to setSales
        } else {
          alert("Failed to update sales.");
        }
      } catch {
        alert("Error updating sales.");
      }
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setDeleteUserId(id);
    setShowDeletePrompt(true);
  };

  const confirmDelete = () => {
    if (!deleteUserId) return;
    const token = localStorage.getItem("accessToken");
    fetch(`https://accordbackend.onrender.com/api/users/${deleteUserId}`, {
      method: "DELETE",
      headers: {
        Authorization: token ? `Bearer ${token}` : ""
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers((prev) => prev.filter((u) => u._id !== deleteUserId));
        } else {
          alert("Failed to delete user");
        }
        setShowDeletePrompt(false);
        setDeleteUserId(null);
      })
      .catch(() => {
        alert("Error deleting user");
        setShowDeletePrompt(false);
        setDeleteUserId(null);
      });
  };

  // Group sales by userId for details
  const salesByUser: Record<string, Sale[]> = {};
  sales.forEach((sale) => {
    const uid = sale.userId?._id;
    if (!uid) return;
    if (!salesByUser[uid]) salesByUser[uid] = [];
    salesByUser[uid].push(sale);
  });

  // Calculate total sales and target per user
  const salesTotals: Record<string, { totalSales: number; totalTarget: number | null }> = {};
  users.forEach((user) => {
    const userSales = salesByUser[user._id] || [];
    salesTotals[user._id] = {
      totalSales: userSales.reduce((sum, s) => sum + (s.price || 0), 0),
      totalTarget: user.target ?? null,
    };
  });

  // Sorting
  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === "role") {
      return a.role.localeCompare(b.role);
    }
    if (sortBy === "sales") {
      const aTotal = salesTotals[a._id]?.totalSales || 0;
      const bTotal = salesTotals[b._id]?.totalSales || 0;
      return bTotal - aTotal;
    }
    return 0;
  });

  // Add this function before your return statement
  const openModal = (user: User, type: "target" | "sales") => {
    setSelectedUser(user);
    setModalType(type);
    setInputValue(0);
    setEquipment("");
    setModalOpen(true);
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
        <h2 className="text-2xl font-bold">User Manager</h2>
      </div>

      {/* Sort Control */}
      <div className="mb-4">
        <label className="mr-2 font-medium">Sort by:</label>
        <select
          className="border rounded p-2"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="role">Role</option>
          <option value="sales">Highest Sales</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-left border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Role</th>
              <th className="p-3 border text-center">Sales</th>
              <th className="p-3 border text-center">Target</th>
              <th className="p-3 border text-center">Details</th>
              <th className="p-3 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => {
              const hitTarget =
                salesTotals[user._id]?.totalTarget !== null &&
                salesTotals[user._id]?.totalSales !== undefined &&
                salesTotals[user._id]?.totalSales >= (salesTotals[user._id]?.totalTarget ?? 0);

              return (
                <tr
                  key={user._id}
                  className={`hover:bg-gray-50 ${
                    hitTarget ? "bg-yellow-100" : ""
                  }`}
                >
                  <td className="p-3 border">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="p-3 border">{user.email}</td>
                  <td className="p-3 border">{user.role}</td>
                  <td
                    className={`p-3 border text-center font-bold ${
                      hitTarget ? "text-yellow-600" : ""
                    }`}
                  >
                    {salesTotals[user._id]?.totalSales ?? 0}
                  </td>
                  <td className="p-3 border text-center">
                    {salesTotals[user._id]?.totalTarget !== null ? (
                      <span className="font-medium">{salesTotals[user._id]?.totalTarget}</span>
                    ) : editingTargetId === user._id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          className="border rounded p-1 w-20"
                          value={newTargetValue}
                          onChange={(e) => setNewTargetValue(Number(e.target.value))}
                          placeholder="Target"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleInlineTargetSave(user)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTargetId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingTargetId(user._id);
                          setNewTargetValue(0);
                        }}
                      >
                        Set Target
                      </Button>
                    )}
                  </td>
                  <td className="p-3 border text-center">
                    {salesByUser[user._id]?.length ? (
                      <details>
                        <summary className="cursor-pointer text-blue-600">View</summary>
                        <ul className="text-xs mt-2">
                          {salesByUser[user._id].map((sale, idx) => (
                            <li key={idx} className="mb-1">
                              <span className="font-semibold">{sale.equipment}</span>: KES {sale.price.toLocaleString()}<br />
                              <span className="text-gray-500">{new Date(sale.createdAt).toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      <span className="text-gray-400">No Sales</span>
                    )}
                  </td>
                  <td className="p-3 border flex gap-2 justify-center">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openModal(user, "sales")}
                      disabled={salesTotals[user._id]?.totalTarget === null}
                      title={
                        salesTotals[user._id]?.totalTarget === null
                          ? "Set target first"
                          : ""
                      }
                    >
                      Add Sales
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user._id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-bold mb-4">
              {modalType === "target"
                ? `Set Target for ${selectedUser.firstName}`
                : `Add Sales for ${selectedUser.firstName}`}
            </h3>
            {modalType === "sales" && (
              <input
                type="text"
                className="w-full border rounded p-2 mb-4"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="Equipment (e.g. MRI Scan)"
                required
              />
            )}
            <input
              type="number"
              className="w-full border rounded p-2 mb-4"
              value={inputValue}
              onChange={(e) => setInputValue(Number(e.target.value))}
              placeholder={modalType === "sales" ? "Sale Price" : "Target"}
              required
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Prompt */}
      {showDeletePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-red-600">
              Are you sure you want to delete this account?
            </h3>
            <p className="mb-6 text-gray-700">
              This action is <span className="font-bold">undoable</span>.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeletePrompt(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
