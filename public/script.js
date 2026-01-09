console.log("script.js loaded");

/* ============================
   GLOBAL FUNCTIONS (DO NOT HIDE)
============================ */

/* ---------- SAVE TASK ---------- */
function saveTask() {
  const title = document.getElementById("title");
  const description = document.getElementById("description");
  const date = document.getElementById("date");
  const time = document.getElementById("time");
  const priority = document.getElementById("priority");

  if (!title || title.value.trim() === "") {
    alert("Task title is required");
    return;
  }

  fetch("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: title.value.trim(),
      description: description?.value || "",
      due_date: date?.value || null,
      due_time: time?.value || null,
      priority: priority?.value || "Low",
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to save task");
      return res.json();
    })
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .then(() => {
      showToast("Task added successfully", "success");
    })
    .catch((err) => {
      console.error(err);
      showToast("Error saving task", "error");
    });
}

/* ---------- TASK ACTIONS ---------- */
function markComplete(id) {
  fetch(`/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "completed" }),
  })
    .then(() => location.reload())
    .then(() => {
      showToast("Task marked as completed", "success");
    })
    .catch((err) => {
      console.error("Complete failed", err);
      showToast("Error marking task as completed", "error");
    });
}

function softDelete(id) {
  fetch(`/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "deleted" }),
  })
    .then(() => location.reload())
    .then(() => {
      showToast("Task moved to Deleted", "info");
    })
    .catch((err) => {
      console.error("Delete failed", err);
      showToast("Error marking task as deleted", "error");
    });
}

function hardDelete(id) {
  if (!confirm("This will permanently delete the task. Continue?")) return;

  fetch(`/tasks/${id}/permanent`, {
    method: "DELETE",
  })
    .then(location.reload())
    .then(() => {
      showToast("Task permanently deleted", "success");
    })
    .catch((err) => {
      console.error("Hard delete failed", err);
      showToast("Error permanently deleting task", "error");
    });
}

/* ---------- NAV ---------- */
function returnToDashboard() {
  window.location.href = "dashboard.html";
  showToast("Returned to Dashboard", "info");
}

function logout() {
  localStorage.removeItem("taskflow-auth");
  window.location.href = "index.html";
}

/* =====================================================
   TOAST HELPER
===================================================== */
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const iconMap = {
    success: "bi-check-circle-fill",
    error: "bi-x-circle-fill",
    info: "bi-info-circle-fill"
  };

  toast.innerHTML = `
    <i class="bi ${iconMap[type] || iconMap.info}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toast-out 0.3s ease forwards";
    setTimeout(() => toast.remove(), 1000);
  }, 6000);
}


/* ============================
   DOM READY
============================ */
document.addEventListener("DOMContentLoaded", () => {
  /* ---------- AUTH ---------- */
  const protectedPages = ["dashboard.html", "add-task.html", "contact.html"];
  const currentPage = location.pathname.split("/").pop();

  if (
    protectedPages.includes(currentPage) &&
    localStorage.getItem("taskflow-auth") !== "true"
  ) {
    location.replace("login.html");
    return;
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      localStorage.setItem("taskflow-auth", "true");
      location.href = "dashboard.html";
    });
  }

  /* ---------- SIDEBAR ---------- */
  const sidebar = document.querySelector(".sidebar");

  document
    .getElementById("sidebarToggle")
    ?.addEventListener("click", () => sidebar?.classList.add("open"));

  document
    .getElementById("sidebarClose")
    ?.addEventListener("click", () => sidebar?.classList.remove("open"));

  /* ---------- LOAD TASKS ---------- */
  loadTasks();

  /* ---------- BUTTON EVENTS ---------- */
  document.addEventListener("click", (e) => {
    const completeBtn = e.target.closest(".btn-complete");
    const deleteBtn = e.target.closest(".btn-delete");
    const hardDeleteBtn = e.target.closest(".btn-hard-delete");

    if (completeBtn) {
      e.preventDefault();
      markComplete(completeBtn.dataset.id);
      return;
    }

    if (deleteBtn) {
      e.preventDefault();
      softDelete(deleteBtn.dataset.id);
      return;
    }

    if (hardDeleteBtn) {
      e.preventDefault();
      hardDelete(hardDeleteBtn.dataset.id);
    }
  });

  /* ---------- FILTER TABS ---------- */
  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-filter]")
        .forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");
      loadTasks(btn.dataset.filter);
    });
  });
});

/* ============================
   LOAD TASKS
============================ */
function loadTasks(filter = "all") {
  const grid = document.getElementById("taskGrid");
  if (!grid) return;

  fetch(`/tasks?status=${filter}`)
    .then((res) => res.json())
    .then((tasks) => {
      grid.innerHTML = "";

      // Default view = only ACTIVE tasks
      const visibleTasks =
        filter === "all" ? tasks.filter((t) => t.status === "active") : tasks;

      if (!visibleTasks.length) {
        grid.innerHTML = "<p style='opacity:.6'>No tasks found</p>";
        return;
      }

      visibleTasks.forEach((task) => {
        const card = document.createElement("div");
        card.className = `task-card fade-up status-${task.status}`;

        let actionsHTML = "";

        if (task.status === "active") {
          actionsHTML = `
            <button class="btn-complete" data-id="${task.id}">✓</button>
            <button class="btn-delete" data-id="${task.id}">🗑</button>
          `;
        }

        if (task.status === "completed") {
          actionsHTML = `
            <button class="btn-delete" data-id="${task.id}">🗑</button>
          `;
        }

        if (task.status === "deleted") {
          actionsHTML = `
            <button
              class="btn-hard-delete"
              onclick="hardDelete(${task.id})"
              title="Delete permanently"
              aria-label="Delete permanently"
            >
              <i class="bi bi-trash3-fill"></i>
            </button>
          `;
        }

        card.innerHTML = `
          <div class="task-header">
            <span class="badge-priority priority-${task.priority}">
              ${task.priority}
            </span>
            <div class="task-actions">
              ${actionsHTML}
            </div>
          </div>

          <div class="task-title">${task.title}</div>
          <div class="task-desc">${task.description || ""}</div>
          <div class="task-date">
            Due: ${task.due_date || "—"} ${task.due_time || ""}
          </div>
        `;

        grid.appendChild(card);
      });
    })
    .catch((err) => console.error("Load tasks failed", err));
}

/* ===============================
   NAVBAR SCROLL EFFECT
================================ */
(() => {
  const navbar = document.querySelector(".top-navbar");
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 10);
  };

  window.addEventListener("scroll", onScroll);
  onScroll();
})();
