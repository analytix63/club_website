const adminSupabase = window.supabase.createClient(
    'https://vuzmibyfblomrurzrlhf.supabase.co',
    'sb_publishable_sD1LFJWcSehcgUg1a9210A_TBM9uuMX'
);
const loginPanel = document.getElementById('loginPanel');
const dashboard = document.getElementById('dashboard');
const loginMessage = document.getElementById('loginMessage');
const applicationsList = document.getElementById('applicationsList');
const eventsAdminList = document.getElementById('eventsAdminList');

function safeText(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function setMessage(elementId, text, kind = '') {
    const element = document.getElementById(elementId);
    element.textContent = text;
    element.className = `message ${kind}`;
}
function showLogin(message = '') {
    dashboard.hidden = true;
    loginPanel.hidden = false;
    loginMessage.textContent = message;
}
async function verifyAdmin() {
    const { data: { user }, error } = await adminSupabase.auth.getUser();
    if (error || !user) { showLogin(); return false; }
    const { data, error: adminError } = await adminSupabase.from('club_admins')
        .select('user_id').eq('user_id', user.id).maybeSingle();
    if (adminError || !data) {
        await adminSupabase.auth.signOut();
        showLogin('This account does not have admin access.');
        return false;
    }
    loginPanel.hidden = true;
    dashboard.hidden = false;
    await Promise.all([loadApplications(), loadManagedEvents()]);
    return true;
}

document.getElementById('loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    loginMessage.textContent = 'Signing in…';
    const { error } = await adminSupabase.auth.signInWithPassword({
        email: document.getElementById('adminEmail').value.trim(),
        password: document.getElementById('adminPassword').value
    });
    button.disabled = false;
    if (error) { loginMessage.textContent = 'Sign in failed. Check your email and password.'; return; }
    await verifyAdmin();
});

document.getElementById('signOutButton').addEventListener('click', async () => {
    await adminSupabase.auth.signOut();
    showLogin('You have signed out.');
});

document.querySelectorAll('.tab-button').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.toggle('active', tab === button));
    document.querySelectorAll('.dash-panel').forEach(panel => panel.hidden = panel.id !== button.dataset.panel);
}));

document.getElementById('refreshApplications').addEventListener('click', loadApplications);

async function loadApplications() {
    applicationsList.innerHTML = '<p class="muted">Loading applications…</p>';
    const { data, error } = await adminSupabase.from('membership_applications')
        .select('id,full_name,email,academic_year,preferred_department,skills_interests,reason,application_status,created_at')
        .order('created_at', { ascending: false });
    if (error) {
        applicationsList.innerHTML = '<p class="empty">Could not load applications. Check the SQL setup and admin permissions.</p>';
        console.error(error);
        return;
    }
    if (!data?.length) { applicationsList.innerHTML = '<p class="empty">No applications received yet.</p>'; return; }
    applicationsList.innerHTML = data.map(application => `<article class="record">
    <div class="record-top"><div><h3>${safeText(application.full_name)}</h3><div class="record-meta">${safeText(application.email)} · ${safeText(application.academic_year)} · ${safeText(application.preferred_department)}</div></div>
    <div class="record-actions"><label>Status<select data-application-id="${safeText(application.id)}" class="application-status"><option value="pending" ${application.application_status === 'pending' ? 'selected' : ''}>Pending</option><option value="reviewed" ${application.application_status === 'reviewed' ? 'selected' : ''}>Reviewed</option><option value="accepted" ${application.application_status === 'accepted' ? 'selected' : ''}>Accepted</option><option value="rejected" ${application.application_status === 'rejected' ? 'selected' : ''}>Rejected</option></select></label></div></div>
    ${application.skills_interests ? `<p><b>Skills/interests:</b> ${safeText(application.skills_interests)}</p>` : ''}<p><b>Why they want to join:</b> ${safeText(application.reason)}</p><div class="record-meta">Received ${safeText(new Date(application.created_at).toLocaleString())}</div>
  </article>`).join('');
    applicationsList.querySelectorAll('.application-status').forEach(select => select.addEventListener('change', async () => {
        select.disabled = true;
        const { error: updateError } = await adminSupabase.from('membership_applications')
            .update({ application_status: select.value }).eq('id', select.dataset.applicationId);
        select.disabled = false;
        if (updateError) { setMessage('applicationsMessage', 'Could not update this application status.', 'error'); console.error(updateError); }
        else setMessage('applicationsMessage', 'Application status updated.', 'success');
    }));
}

const eventForm = document.getElementById('eventForm');
eventForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = eventForm.querySelector('button[type="submit"]');
    button.disabled = true;
    setMessage('eventMessage', 'Saving event…');
    const form = new FormData(eventForm);
    const startsAt = new Date(form.get('starts_at'));
    const newEvent = {
        title: String(form.get('title')).trim(),
        description: String(form.get('description')).trim(),
        starts_at: startsAt.toISOString(),
        location: String(form.get('location')).trim(),
        registration_link: String(form.get('registration_link')).trim() || null,
        status: String(form.get('status'))
    };
    const { error } = await adminSupabase.from('events').insert(newEvent);
    button.disabled = false;
    if (error) { setMessage('eventMessage', 'Could not save the event. Check the SQL setup and required fields.', 'error'); console.error(error); return; }
    eventForm.reset();
    setMessage('eventMessage', 'Event saved.', 'success');
    await loadManagedEvents();
});

async function loadManagedEvents() {
    eventsAdminList.innerHTML = '<p class="muted">Loading events…</p>';
    const { data, error } = await adminSupabase.from('events')
        .select('id,title,description,starts_at,location,status')
        .order('starts_at', { ascending: true });
    if (error) { eventsAdminList.innerHTML = '<p class="empty">Could not load events. Check the SQL setup and admin permissions.</p>'; console.error(error); return; }
    if (!data?.length) { eventsAdminList.innerHTML = '<p class="empty">No events yet. Add one above when you are ready.</p>'; return; }
    eventsAdminList.innerHTML = data.map(item => `<article class="record"><div class="record-top"><div><h3>${safeText(item.title)}</h3><p>${safeText(item.description)}</p><div class="record-meta">${safeText(new Date(item.starts_at).toLocaleString())}${item.location ? ` · ${safeText(item.location)}` : ''}</div></div><div class="record-actions"><label>Visibility<select class="event-status" data-event-id="${safeText(item.id)}"><option value="draft" ${item.status === 'draft' ? 'selected' : ''}>Draft</option><option value="published" ${item.status === 'published' ? 'selected' : ''}>Published</option><option value="completed" ${item.status === 'completed' ? 'selected' : ''}>Completed</option></select></label><button class="danger-btn delete-event" data-event-id="${safeText(item.id)}">Delete</button></div></div></article>`).join('');
    eventsAdminList.querySelectorAll('.event-status').forEach(select => select.addEventListener('change', async () => {
        select.disabled = true;
        const { error: updateError } = await adminSupabase.from('events').update({ status: select.value }).eq('id', select.dataset.eventId);
        select.disabled = false;
        if (updateError) { setMessage('eventMessage', 'Could not update event visibility.', 'error'); console.error(updateError); }
        else { setMessage('eventMessage', 'Event visibility updated.', 'success'); await loadManagedEvents(); }
    }));
    eventsAdminList.querySelectorAll('.delete-event').forEach(button => button.addEventListener('click', async () => {
        if (!window.confirm('Delete this event?')) return;
        button.disabled = true;
        const { error: deleteError } = await adminSupabase.from('events').delete().eq('id', button.dataset.eventId);
        if (deleteError) { button.disabled = false; setMessage('eventMessage', 'Could not delete this event.', 'error'); console.error(deleteError); }
        else { setMessage('eventMessage', 'Event deleted.', 'success'); await loadManagedEvents(); }
    }));
}

(async () => {
    const { data: { session } } = await adminSupabase.auth.getSession();
    if (session) await verifyAdmin();
})();
