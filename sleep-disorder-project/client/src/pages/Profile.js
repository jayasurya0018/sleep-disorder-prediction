import React, { useState, useEffect, useContext } from 'react';
import { LogOutIcon, Edit2Icon } from 'lucide-react';
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
    <div className="modern-profile-bg">
      <style>{`
        .modern-profile-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #e0e7ff 0%, #f5f7fa 100%);
          padding: 2rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .profile-info-card {
          background: #fff;
          border-radius: 1.5rem;
          box-shadow: 0 8px 32px #7f53ac22;
          padding: 2.5rem 2rem;
          max-width: 420px;
          width: 100%;
          margin: 2rem auto 1.5rem auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          animation: fade-in 0.7s;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .profile-info-photo {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 1rem;
          background: #e0e7ff;
          box-shadow: 0 2px 12px #7f53ac22;
          position: relative;
        }
        .profile-edit-avatar-btn {
          position: absolute;
          top: 22px;
          right: 22px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 2px 8px #7f53ac22;
          border: none;
          padding: 0.4rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .profile-edit-avatar-btn:hover {
          background: #e0e7ff;
        }
        .profile-completeness {
          position: absolute;
          top: 18px;
          left: 18px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .profile-completeness-circle {
          stroke: #7f53ac;
          stroke-width: 6;
          fill: none;
        }
        .profile-completeness-text {
          font-size: 0.9rem;
          font-weight: 700;
          color: #7f53ac;
          position: absolute;
          left: 0;
          right: 0;
          top: 10px;
          text-align: center;
        }
        .profile-info-name {
          font-size: 1.7rem;
          font-weight: 800;
          color: #7f53ac;
          margin-bottom: 0.3rem;
        }
        .profile-info-email {
          font-size: 1.08rem;
          color: #444;
          margin-bottom: 0.7rem;
        }
        .profile-info-age, .profile-info-gender {
          font-size: 1.08rem;
          color: #444;
          margin-bottom: 0.5rem;
        }
        .modern-form-section {
          background: #fff;
          border-radius: 1.2rem;
          box-shadow: 0 2px 12px #7f53ac11;
          padding: 2rem 1.5rem;
          max-width: 420px;
          width: 100%;
          margin: 0 auto 2rem auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: fade-in 0.7s;
        }
        .modern-form-label {
          font-size: 1.08rem;
          color: #232946;
          font-weight: 600;
          margin-bottom: 0.2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .modern-form-input {
          width: 100%;
          max-width: 320px;
          padding: 0.7rem 1rem;
          border-radius: 0.8rem;
          border: 1.5px solid #e0e7ff;
          background: #f7f8fa;
          font-size: 1.05rem;
          color: #232946;
          font-family: inherit;
          margin-top: 0.1rem;
          transition: border 0.2s, box-shadow 0.2s;
          outline: none;
          box-shadow: 0 1px 4px #7f53ac11;
        }
        .modern-form-input::placeholder {
          color: #a0aec0;
          opacity: 1;
          font-size: 1rem;
          font-weight: 500;
        }
        .modern-form-input:focus {
          border: 1.5px solid #7f53ac;
          box-shadow: 0 2px 12px #7f53ac22;
          background: #fff;
        }
        .profile-edit-btn, .profile-save-btn, .profile-cancel-btn {
          background: linear-gradient(90deg, #7f53ac 0%, #38b2ac 100%);
          color: #fff;
          border: none;
          border-radius: 0.8rem;
          padding: 0.7rem 1.5rem;
          font-weight: 700;
          margin: 0.5rem 0.3rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .profile-edit-btn:hover, .profile-save-btn:hover, .profile-cancel-btn:hover {
          background: linear-gradient(90deg, #38b2ac 0%, #7f53ac 100%);
          transform: scale(1.04);
        }
        .profile-logout-btn {
          background: #fff;
          color: #7f53ac;
          border: 1.5px solid #7f53ac;
          border-radius: 0.8rem;
          padding: 0.6rem 1.2rem;
          font-weight: 700;
          margin-top: 1rem;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .profile-logout-btn:hover {
          background: #7f53ac;
          color: #fff;
        }
        .profile-dropdown {
          position: absolute;
          top: 60px;
          right: 0;
          background: #fff;
          border-radius: 1rem;
          box-shadow: 0 4px 24px #7f53ac22;
          min-width: 180px;
          z-index: 100;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .profile-dropdown-btn {
          background: linear-gradient(90deg, #7f53ac 0%, #38b2ac 100%);
          color: #fff;
          border: none;
          border-radius: 0.8rem;
          padding: 0.6rem 1.2rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .profile-dropdown-btn:hover {
          background: linear-gradient(90deg, #38b2ac 0%, #7f53ac 100%);
        }
        .profile-loading-spinner {
          border: 4px solid #e0e7ff;
          border-top: 4px solid #7f53ac;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          animation: spin 0.8s linear infinite;
          margin: 1rem auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 600px) {
          .modern-profile-bg {
            padding: 1rem 0;
          }
          .profile-info-card, .modern-form-section {
            padding: 1.2rem 0.5rem;
            max-width: 98vw;
          }
          .modern-form-input {
            max-width: 98vw;
            font-size: 0.98rem;
            padding: 0.6rem 0.7rem;
          }
        }
      `}</style>
      <div className="profile-info-card">
        <div className="profile-completeness">
          <svg width="38" height="38">
            <circle className="profile-completeness-circle" cx="19" cy="19" r="16" style={{ strokeDasharray: 100, strokeDashoffset: 100 - completeness }} />
          </svg>
          <div className="profile-completeness-text">{completeness}%</div>
        </div>
        <img src={contextUser?.photo || 'https://ui-avatars.com/api/?name=' + contextUser?.name} alt="Profile" className="profile-info-photo" />
        <button className="profile-edit-avatar-btn" onClick={() => setEditing(true)} title="Edit Photo"><Edit2Icon size={18} /></button>
        <div className="profile-info-name">{contextUser?.name}</div>
        <div className="profile-info-email">{contextUser?.email}</div>
        <div className="profile-info-age">Age: {contextUser?.age}</div>
        <div className="profile-info-gender">Gender: {contextUser?.gender}</div>
        <button className="profile-logout-btn" onClick={logout}><LogOutIcon size={18} /> Logout</button>
        {dropdownOpen && (
          <div className="profile-dropdown">
            <button className="profile-dropdown-btn" onClick={logout}><LogOutIcon size={18} /> Logout</button>
          </div>
        )}
      </div>
      {loading && <div className="profile-loading-spinner" />}
      {editing ? (
        <form onSubmit={handleSave} style={{ width: '100%' }}>
          <label className="modern-form-label">Name:<br />
            <input name="name" value={formState.name} onChange={handleChange} className="modern-form-input" />
          </label><br />
          <label className="modern-form-label">Email:<br />
            <input name="email" value={formState.email} onChange={handleChange} className="modern-form-input" />
          </label><br />
          <label className="modern-form-label">Age:<br />
            <input name="age" type="number" value={formState.age} onChange={handleChange} className="modern-form-input" />
          </label><br />
          <label className="modern-form-label">Gender:<br />
            <select name="gender" value={formState.gender} onChange={handleChange} className="modern-form-input">
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label><br />
          <label className="modern-form-label">Photo:<br />
            <input type="file" accept="image/*" name="photo" onChange={handleChange} className="modern-form-input" />
          </label><br />
          <button type="submit" className="profile-save-btn" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          <button type="button" className="profile-cancel-btn" onClick={handleCancel}>Cancel</button>
        </form>
      ) : (
        <>
          <div className="modern-form-label" style={{ marginBottom: 8 }}>Name: {formState.name}</div>
          <div className="modern-form-label" style={{ marginBottom: 8 }}>Email: {formState.email}</div>
          <div className="modern-form-label" style={{ marginBottom: 8 }}>Age: {formState.age}</div>
          <div className="modern-form-label" style={{ marginBottom: 8 }}>Gender: {formState.gender}</div>
          <button className="profile-edit-btn" onClick={handleEdit}>Edit Profile</button>
        </>
      )}
      {toast && (
        <div className={`profile-toast profile-toast-${toast.type}`}>
          {typeof toast.message === 'object' ? (toast.message.message || toast.message.type || JSON.stringify(toast.message)) : toast.message}
        </div>
      )}
    </div>
  );
};

export default Profile;
