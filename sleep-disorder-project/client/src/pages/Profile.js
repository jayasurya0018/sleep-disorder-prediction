import React, { useState, useEffect, useContext } from 'react';
import { LogOut, Edit2, User, Mail, User as UserIcon, Users } from 'lucide-react';
import { useNotification } from '../components/NotificationProvider';
import { UserContext } from '../UserContext';

const Profile = ({ onUpdate, logout }) => {
  const { user: contextUser, updateUser } = useContext(UserContext);
  const [formState, setFormState] = useState({
    name: contextUser?.name || '',
    email: contextUser?.email || '',
    photo: contextUser?.photo || '',
    age: contextUser?.age || '',
    gender: contextUser?.gender || '',
  });
  const [photoPreview, setPhotoPreview] = useState(formState.photo);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const { showNotification } = useNotification();

  // Profile completeness calculation
  const completeness = [formState.name, formState.email, formState.age, formState.gender, formState.photo].filter(Boolean).length * 20;

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState((prev) => ({ ...prev, photo: reader.result }));
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = () => setEditing(true);
  const handleCancel = () => {
    setEditing(false);
    setFormState({ name: contextUser?.name || '', email: contextUser?.email || '', photo: contextUser?.photo || '' });
    setPhotoPreview(contextUser?.photo || '');
    setError('');
  };
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/auth/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formState),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updated = await res.json();
      setEditing(false);
      if (onUpdate) onUpdate(updated);
      if (updateUser) updateUser(updated);
      showNotification('Profile updated successfully!', 'success');
    } catch (err) {
      setError(err.message);
      showNotification(err.message || 'Profile update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Error toast
  useEffect(() => {
    if (error) {
      let msg = error;
      if (typeof error === 'object') {
        msg = error.message || error.type || JSON.stringify(error);
      }
      setToast({ type: 'error', message: msg });
      setTimeout(() => setToast(null), 3500);
    }
  }, [error]);

  return (
    <div style={{ padding: 'var(--space-xl) 0', minHeight: '100vh' }}>
      <div className="container-custom" style={{ maxWidth: '500px' }}>
        {/* Profile Card */}
        <div className="card fade-in" style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>
          {/* Completeness Circle */}
          <div style={{ position: 'absolute', top: 'var(--space-lg)', left: 'var(--space-lg)', width: '50px', height: '50px' }}>
            <svg width="50" height="50" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="25" cy="25" r="20" fill="none" stroke="hsl(var(--border-input))" strokeWidth="3" />
              <circle cx="25" cy="25" r="20" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" 
                style={{ strokeDasharray: 125, strokeDashoffset: 125 - (completeness * 1.25) }} />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: 'hsl(var(--primary))' }}>{completeness}%</div>
          </div>

          {/* Profile Photo */}
          <div style={{ position: 'relative', marginBottom: 'var(--space-lg)' }}>
            <img 
              src={contextUser?.photo || `https://ui-avatars.com/api/?name=${contextUser?.name}`} 
              alt="Profile" 
              style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', boxShadow: 'var(--shadow-lg)' }} 
            />
            {editing && (
              <button 
                className="btn btn-icon" 
                type="button"
                onClick={() => setEditing(true)} 
                style={{ position: 'absolute', bottom: 0, right: 0, background: 'hsl(var(--background))', boxShadow: 'var(--shadow-md)', padding: 'var(--space-xs)' }}
                title="Edit Photo"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>

          {/* Profile Info */}
          <h1 className="text-gradient" style={{ marginBottom: 'var(--space-sm)' }}>{contextUser?.name}</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'hsl(var(--muted-foreground))' }}>
              <Mail size={16} />
              <span>{contextUser?.email}</span>
            </div>
            {contextUser?.age && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'hsl(var(--muted-foreground))' }}>
                <UserIcon size={16} />
                <span>Age: {contextUser?.age}</span>
              </div>
            )}
            {contextUser?.gender && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'hsl(var(--muted-foreground))' }}>
                <Users size={16} />
                <span>{contextUser?.gender}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!editing ? (
              <>
                <button className="btn btn-primary" onClick={handleEdit}>
                  <Edit2 size={16} />
                  Edit Profile
                </button>
                <button className="btn btn-outline" onClick={logout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" type="submit" form="profile-form" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-outline" type="button" onClick={handleCancel}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <form id="profile-form" onSubmit={handleSave} className="card fade-in" style={{ marginBottom: 'var(--space-2xl)' }}>
            <h2 className="text-gradient" style={{ marginBottom: 'var(--space-lg)' }}>Edit Profile</h2>
            
            <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
              <label className="form-label">Full Name</label>
              <input 
                type="text"
                name="name" 
                value={formState.name} 
                onChange={handleChange} 
                className="form-input"
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
              <label className="form-label">Email</label>
              <input 
                type="email"
                name="email" 
                value={formState.email} 
                onChange={handleChange} 
                className="form-input"
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
              <label className="form-label">Age</label>
              <input 
                type="number"
                name="age" 
                value={formState.age} 
                onChange={handleChange} 
                className="form-input"
                placeholder="Enter your age"
                min="1"
                max="150"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
              <label className="form-label">Gender</label>
              <select name="gender" value={formState.gender} onChange={handleChange} className="form-input">
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
              <label className="form-label">Profile Photo</label>
              <input 
                type="file" 
                accept="image/*" 
                name="photo" 
                onChange={handleChange} 
                className="form-input"
              />
              {photoPreview && (
                <div style={{ marginTop: 'var(--space-md)' }}>
                  <img src={photoPreview} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            {error && (
              <div className="alert alert-destructive" style={{ marginBottom: 'var(--space-lg)' }}>
                {error}
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                <div className="spinner"></div>
              </div>
            )}
          </form>
        )}

        {/* Display Mode */}
        {!editing && (
          <div className="card fade-in" style={{ marginBottom: 'var(--space-2xl)' }}>
            <h2 className="text-gradient" style={{ marginBottom: 'var(--space-lg)' }}>Profile Details</h2>
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              <div className="stat-card">
                <div style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-xs)' }}>Name</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>{formState.name || 'Not set'}</div>
              </div>
              <div className="stat-card">
                <div style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-xs)' }}>Email</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', wordBreak: 'break-all' }}>{formState.email || 'Not set'}</div>
              </div>
              {formState.age && (
                <div className="stat-card">
                  <div style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-xs)' }}>Age</div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>{formState.age}</div>
                </div>
              )}
              {formState.gender && (
                <div className="stat-card">
                  <div style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-xs)' }}>Gender</div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>{formState.gender}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Toast */}
        {toast && (
          <div className={`alert alert-${toast.type}`} style={{ position: 'fixed', bottom: 'var(--space-lg)', right: 'var(--space-lg)', zIndex: 'var(--z-modal)' }}>
            {typeof toast.message === 'object' ? (toast.message.message || toast.message.type || JSON.stringify(toast.message)) : toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
