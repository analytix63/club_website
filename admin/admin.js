const adminSupabase = window.supabase.createClient(
  "https://ntwayeltgeqdjbcjnchc.supabase.co",
  "sb_publishable_YlLf32QTY7LnU7k9_2J_Wg_yMc3OBCv"
);
const $ = (id) => document.getElementById(id);
const loginPanel = $("loginPanel");
const dashboard = $("dashboard");
const loginForm = $("loginForm");
const loginMessage = $("loginMessage");
const signOutButton = $("signOutButton");
let currentUser = null;
let allMembers = [];

function showMessage(element, message, type = "") {
  if (!element) return;
  element.textContent = message;
  element.className = "message";
  if (type) element.classList.add(type);
}
function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text ?? "");
  return element;
}
function formatDate(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString();
}
function getErrorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}
function setSignedIn(signedIn) {
  if (loginPanel) loginPanel.hidden = signedIn;
  if (dashboard) dashboard.hidden = !signedIn;
}

function setupTabs() {
  const nav = document.querySelector(".tabs");
  if (!nav || !dashboard) return;

  if (!nav.querySelector('[data-panel="membersPanel"]')) {
    const membersTab = makeElement("button", "tab-button", "Members");
    membersTab.type = "button";
    membersTab.dataset.panel = "membersPanel";
    nav.appendChild(membersTab);
  }

  if (!$("membersPanel")) {
    const panel = document.createElement("section");
    panel.id = "membersPanel";
    panel.className = "dash-panel card";
    panel.hidden = true;
    panel.append(
      makeElement("h2", "", "Club Members"),
      makeElement("p", "muted", "View member profiles stored in Supabase.")
    );
    const refreshButton = makeElement(
      "button",
      "secondary-btn",
      "Refresh members"
    );
    refreshButton.type = "button";
    refreshButton.id = "refreshMembers";
    const message = makeElement("p", "message", "");
    message.id = "membersMessage";
    message.setAttribute("role", "status");
    const search = document.createElement("input");
    search.id = "memberSearch";
    search.type = "search";
    search.placeholder = "Search by name, department, course, or year...";
    search.setAttribute("aria-label", "Search members");
    const list = document.createElement("div");
    list.id = "membersList";
    panel.append(refreshButton, search, message, list);
    dashboard.appendChild(panel);
  }

  if (nav.dataset.tabsReady === "true") return;
  nav.dataset.tabsReady = "true";

  nav.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-panel]");
    if (!tab || !nav.contains(tab)) return;
    const targetPanel = $(tab.dataset.panel);
    if (!targetPanel) return;

    nav.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.toggle("active", button === tab);
    });
    document.querySelectorAll(".dash-panel").forEach((panel) => {
      panel.hidden = panel !== targetPanel;
    });

    if (tab.dataset.panel === "applicationsPanel") loadApplications();
    if (tab.dataset.panel === "eventsPanel") loadEvents();
    if (tab.dataset.panel === "membersPanel") loadMembers();
  });

  $("refreshMembers")?.addEventListener("click", loadMembers);
  $("memberSearch")?.addEventListener("input", filterMembers);
  $("departmentFilter")?.addEventListener("change", filterMembers);
  $("memberSort")?.addEventListener("change", filterMembers);
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = $("adminEmail")?.value.trim();
  const password = $("adminPassword")?.value;

  if (!email || !password) {
    showMessage(loginMessage, "Enter your email and password.", "error");
    return;
  }

  const submitButton = loginForm.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  showMessage(loginMessage, "Signing in…");

  try {
    const { data, error } = await adminSupabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    currentUser = data.user;
    setSignedIn(true);
    showMessage(loginMessage, "");
    await refreshDashboard();
  } catch (error) {
    setSignedIn(false);
    showMessage(loginMessage, getErrorMessage(error), "error");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

signOutButton?.addEventListener("click", async () => {
  signOutButton.disabled = true;
  try {
    const { error } = await adminSupabase.auth.signOut();
    if (error) throw error;
    currentUser = null;
    setSignedIn(false);
  } catch (error) {
    alert("Could not sign out: " + getErrorMessage(error));
  } finally {
    signOutButton.disabled = false;
  }
});

async function loadApplications() {
  const list = $("applicationsList");
  const message = $("applicationsMessage");
  if (!list) return;
  list.replaceChildren(makeElement("p", "muted", "Loading applications…"));
  showMessage(message, "");

  try {
    const { data, error } = await adminSupabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    list.replaceChildren();

    if (!data?.length) {
      list.appendChild(makeElement("p", "empty", "No applications found."));
      return;
    }

    data.forEach((application) => {
      const record = makeElement("article", "record");
      record.appendChild(
        makeElement(
          "h3",
          "",
          application.full_name ||
            application.name ||
            application.email ||
            "Membership application"
        )
      );

      const details = makeElement("div", "record-meta");
      [
        ["Email", application.email],
        ["Department", application.department],
        ["Course", application.course],
        ["Year", application.year_of_study],
        ["Submitted", formatDate(application.created_at)],
        ["Status", application.status]
      ].forEach(([label, value]) => {
        if (value === undefined || value === null || value === "") return;
        details.appendChild(makeElement("p", "", `${label}: ${value}`));
      });
      record.appendChild(details);

      if (
        application.id !== undefined &&
        Object.prototype.hasOwnProperty.call(application, "status")
      ) {
        const actions = makeElement("div", "record-actions");
        const select = document.createElement("select");
        select.setAttribute("aria-label", "Application status");

        ["pending", "approved", "rejected"].forEach((status) => {
          const option = document.createElement("option");
          option.value = status;
          option.textContent = status;
          select.appendChild(option);
        });

        const existingStatus = String(
          application.status || "pending"
        ).toLowerCase();
        if (["pending", "approved", "rejected"].includes(existingStatus)) {
          select.value = existingStatus;
        }

        const saveButton = makeElement("button", "", "Save status");
        saveButton.type = "button";
        saveButton.addEventListener("click", async () => {
          saveButton.disabled = true;
          try {
            const { error } = await adminSupabase
              .from("applications")
              .update({ status: select.value })
              .eq("id", application.id);
            if (error) throw error;
            showMessage(message, "Application status updated.", "success");
            await loadApplications();
          } catch (error) {
            showMessage(
              message,
              "Could not update status: " + getErrorMessage(error),
              "error"
            );
          } finally {
            saveButton.disabled = false;
          }
        });

        actions.append(select, saveButton);
        record.appendChild(actions);
      }
      list.appendChild(record);
    });
  } catch (error) {
    list.replaceChildren(
      makeElement(
        "p",
        "message error",
        "Could not load applications: " + getErrorMessage(error)
      )
    );
  }
}
$("refreshApplications")?.addEventListener("click", loadApplications);
async function loadEvents() {
  const list = $("eventsAdminList");
  const message = $("eventMessage");
  if (!list) return;
  list.replaceChildren(makeElement("p", "muted", "Loading events…"));

  try {
    const { data, error } = await adminSupabase
      .from("events")
      .select("*")
      .order("starts_at", { ascending: false });
    if (error) throw error;
    list.replaceChildren();

    if (!data?.length) {
      list.appendChild(makeElement("p", "empty", "No events found."));
      return;
    }

    data.forEach((item) => {
      const record = makeElement("article", "record");
      record.appendChild(makeElement("h3", "", item.title || "Untitled event"));
      const details = makeElement("div", "record-meta");
      [
        ["Date", formatDate(item.starts_at)],
        ["Location", item.location],
        ["Status", item.status],
        ["Description", item.description],
        ["Registration link", item.registration_link]
      ].forEach(([label, value]) => {
        if (!value) return;
        details.appendChild(makeElement("p", "", `${label}: ${value}`));
      });
      record.appendChild(details);
      list.appendChild(record);
    });
  } catch (error) {
    list.replaceChildren(
      makeElement(
        "p",
        "message error",
        "Could not load events: " + getErrorMessage(error)
      )
    );
    showMessage(message, getErrorMessage(error), "error");
  }
}

$("eventForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("eventMessage");
  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const startsAt = String(formData.get("starts_at") || "");
  const location = String(formData.get("location") || "").trim();
  const registrationLink = String(
    formData.get("registration_link") || ""
  ).trim();
  const status = String(formData.get("status") || "draft");

  if (!title || !description || !startsAt || !location) {
    showMessage(message, "Complete all required event fields.", "error");
    return;
  }

  const eventDate = new Date(startsAt);
  if (Number.isNaN(eventDate.getTime())) {
    showMessage(message, "Choose a valid event date.", "error");
    return;
  }

  if (submitButton) submitButton.disabled = true;
  showMessage(message, "Saving event…");

  try {
    const { error } = await adminSupabase.from("events").insert({
      title,
      description,
      starts_at: eventDate.toISOString(),
      location,
      registration_link: registrationLink || null,
      status
    });
    if (error) throw error;
    showMessage(message, "Event saved successfully.", "success");
    form.reset();
    await loadEvents();
  } catch (error) {
    showMessage(
      message,
      "Could not save event: " + getErrorMessage(error),
      "error"
    );
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// ---------- Member directory and search ----------
function filterMembers() {
  const query = $("memberSearch")?.value.trim().toLowerCase() || "";
  const departmentFilter = $("departmentFilter");
  const sortOrder = $("memberSort")?.value || "name-asc";

  if (departmentFilter) {
    const selectedDepartment = departmentFilter.value;
    const departments = [
      ...new Set(
        allMembers
          .map((member) => String(member.department || "").trim())
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b));

    departmentFilter.replaceChildren();
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All departments";
    departmentFilter.appendChild(allOption);

    departments.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      departmentFilter.appendChild(option);
    });

    departmentFilter.value = departments.includes(selectedDepartment)
      ? selectedDepartment
      : "";
  }

  const activeDepartment = departmentFilter?.value || "";
  const filtered = allMembers.filter((member) => {
    const searchableText = [
      member.full_name,
      member.name,
      member.department,
      member.course,
      member.graduation_year,
      member.headline,
      member.location,
      member.role
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(query);
    const matchesDepartment =
      !activeDepartment ||
      String(member.department || "").trim() === activeDepartment;

    return matchesSearch && matchesDepartment;
  });

  filtered.sort((a, b) => {
    const nameA = String(a.full_name || a.name || "").trim().toLowerCase();
    const nameB = String(b.full_name || b.name || "").trim().toLowerCase();
    return sortOrder === "name-desc"
      ? nameB.localeCompare(nameA)
      : nameA.localeCompare(nameB);
  });

  displayMembers(filtered);
}

function displayMembers(members) {
  const list = $("membersList");
  const message = $("membersMessage");
  if (!list) return;
  list.replaceChildren();

  if (!members.length) {
    list.appendChild(makeElement("p", "empty", "No matching members found."));
    showMessage(message, "0 members found.");
    return;
  }

  members.forEach((member) => {
    const record = makeElement("article", "record");
    record.appendChild(
      makeElement(
        "h3",
        "",
        member.full_name || member.name || "Unnamed member"
      )
    );

    const details = makeElement("div", "record-meta");
    [
      ["Department", member.department],
      ["Course", member.course],
      ["Headline", member.headline],
      ["Graduation year", member.graduation_year],
      ["Location", member.location],
      ["Role", member.role]
    ].forEach(([label, value]) => {
      if (value === undefined || value === null || value === "") return;
      details.appendChild(makeElement("p", "", `${label}: ${value}`));
    });
    record.appendChild(details);

    const viewButton = makeElement("button", "secondary-btn", "View Full Profile");
    viewButton.type = "button";
    viewButton.addEventListener("click", () => showMemberProfile(member));
    record.appendChild(viewButton);
    list.appendChild(record);
  });

  showMessage(
    message,
    `Showing ${members.length} of ${allMembers.length} member(s).`,
    "success"
  );
}
function showMemberProfile(member) {
  $("memberProfileModal")?.remove();

  const modal = makeElement("div", "member-profile-modal");
  modal.id = "memberProfileModal";

  const dialog = makeElement("section", "member-profile-dialog");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "memberProfileTitle");

  const header = makeElement("div", "member-profile-header");
  const title = makeElement(
    "h2",
    "",
    member.full_name || member.name || "Member Profile"
  );
  title.id = "memberProfileTitle";

  const closeButton = makeElement("button", "", "Close");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close member profile");

  const closeModal = () => {
    modal.remove();
    document.removeEventListener("keydown", handleEscape);
  };

  function handleEscape(event) {
    if (event.key === "Escape") closeModal();
  }

  closeButton.addEventListener("click", closeModal);
  header.append(title, closeButton);
  dialog.appendChild(header);

  const details = makeElement("div", "member-profile-details");

  const excludedFields = new Set([
    "password",
    "encrypted_password",
    "confirmation_token",
    "recovery_token",
    "email_change_token_new",
    "email_change_token_current",
    "phone_change_token",
    "reauthentication_token"
  ]);

  const formatLabel = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  Object.entries(member).forEach(([key, value]) => {
    if (excludedFields.has(key.toLowerCase())) return;
    if (value === null || value === undefined || value === "") return;

    const row = makeElement("div", "member-profile-row");
    row.appendChild(makeElement("strong", "", formatLabel(key)));

    let displayValue = value;

    if (typeof value === "object") {
      try {
        displayValue = JSON.stringify(value, null, 2);
      } catch {
        displayValue = "[Value unavailable]";
      }
    }

    row.appendChild(makeElement("p", "", String(displayValue)));
    details.appendChild(row);
  });

  dialog.appendChild(details);

  const editButton = makeElement("button", "secondary-btn", "Edit Profile");
  editButton.type = "button";

  editButton.addEventListener("click", () => {
    // Prevent opening multiple edit forms.
    if (dialog.querySelector(".member-edit-form")) return;

    const form = document.createElement("form");
    form.className = "member-edit-form";

    const editableFields = [
      "full_name",
      "department",
      "course",
      "graduation_year",
      "headline",
      "location"
    ];

    editableFields.forEach((field) => {
      if (!(field in member)) return;

      const label = makeElement("label", "", field.replace(/_/g, " "));
      const input = document.createElement("input");
      input.name = field;
      input.value = member[field] ?? "";
      input.type = "text";

      label.appendChild(input);
      form.appendChild(label);
    });

    const saveButton = makeElement("button", "secondary-btn", "Save Changes");
    saveButton.type = "submit";

    const cancelButton = makeElement("button", "secondary-btn", "Cancel");
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => form.remove());

    form.append(saveButton, cancelButton);
    dialog.appendChild(form);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      saveButton.disabled = true;

      const updates = {};

      editableFields.forEach((field) => {
        const input = form.elements.namedItem(field);
        if (input) updates[field] = input.value.trim();
      });

      try {
        if (!member.id) {
          throw new Error("Member ID is missing.");
        }

        if (Object.keys(updates).length === 0) {
          throw new Error("No editable profile fields were found.");
        }

        const { data, error } = await adminSupabase
          .from("profiles")
          .update(updates)
          .eq("id", member.id)
          .select();

        if (error) throw error;
        if (!data?.length) {
          throw new Error(
            "No profile was updated. Check your Supabase permissions."
          );
        }

        Object.assign(member, updates);
        alert("Profile updated successfully!");
        closeModal();
        await loadMembers();
      } catch (error) {
        alert("Could not update profile: " + getErrorMessage(error));
      } finally {
        saveButton.disabled = false;
      }
    });
  });

  dialog.appendChild(editButton);
  modal.appendChild(dialog);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  document.body.appendChild(modal);
  document.addEventListener("keydown", handleEscape);
  closeButton.focus();
}

async function loadMembers() {
  const list = $("membersList");
  const message = $("membersMessage");
  if (!list) return;

  list.replaceChildren(makeElement("p", "muted", "Loading members…"));
  showMessage(message, "");

  try {
    const { data, error } = await adminSupabase
      .from("profiles")
      .select("*")
      .limit(200);

    if (error) throw error;

    allMembers = data || [];
    filterMembers();
  } catch (error) {
    list.replaceChildren(
      makeElement(
        "p",
        "message error",
        "Could not load members: " + getErrorMessage(error)
      )
    );

    showMessage(
      message,
      "Check your profiles table and Supabase access policies.",
      "error"
    );
  }
}

// ---------- Startup and session restoration ----------

async function refreshDashboard() {
  setupTabs();

  await Promise.allSettled([
    loadApplications(),
    loadEvents()
  ]);
}

async function initializeAdmin() {
  setupTabs();

  try {
    const { data, error } = await adminSupabase.auth.getSession();
    if (error) throw error;

    currentUser = data.session?.user || null;
    setSignedIn(Boolean(currentUser));

    if (currentUser) await refreshDashboard();
  } catch (error) {
    setSignedIn(false);

    showMessage(
      loginMessage,
      "Could not restore your session: " + getErrorMessage(error),
      "error"
    );
  }
}

adminSupabase.auth.onAuthStateChange((event, session) => {
  currentUser = session?.user || null;

  if (event === "SIGNED_OUT") {
    setSignedIn(false);
  }
});

initializeAdmin();