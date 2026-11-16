function toggleMenu() {
	const menu = document.querySelector(".navigation-menu, .nav-menu, #navigation-menu, #nav-menu");
	if (menu) {
		menu.classList.toggle("active");
	}
}

function normalizeCategory(value) {
	return String(value || "")
		.trim()
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

function filterProjects(category) {
	const projects = document.querySelectorAll(
		"#projects .project, #projects .project-card, #projects .project-item, " +
		".projects-section .project, .projects-section .project-card, .projects-section .project-item, " +
		".project, .project-card, .project-item"
	);
	const selectedCategory = normalizeCategory(category || "all");
	const showAll = !selectedCategory || ["all", "all-projects", "all-categories", "*"].includes(selectedCategory);

	projects.forEach((project) => {
		const categories = [project.dataset.category, project.dataset.categories]
			.filter(Boolean)
			.flatMap((value) => value.split(/[,;|]+/))
			.map(normalizeCategory);
		const matches = showAll || categories.includes(selectedCategory);
		project.hidden = !matches;
		// Inline display ensures filtering also works when page CSS overrides [hidden].
		project.style.display = matches ? "" : "none";
	});
}

document.addEventListener("DOMContentLoaded", () => {
	const contactForm = document.querySelector(
		"#contact form, form#contact, .contact-form, form[name='contact']"
	);
	if (contactForm) {
		const nameField = contactForm.querySelector('[name="name"], #name, [name="fullName"]');
		const emailField = contactForm.querySelector('[name="email"], #email');
		const messageField = contactForm.querySelector('[name="message"], #message');

		const fields = [nameField, emailField, messageField].filter(Boolean);
		fields.forEach((field) => {
			field.required = true;
		});
		if (emailField) {
			emailField.type = "email";
		}

		const feedbackIds = new Map();
		fields.forEach((field, index) => {
			const feedback = document.createElement("span");
			feedback.id = `contact-field-error-${index}`;
			feedback.className = "field-error";
			feedback.setAttribute("aria-live", "polite");
			feedback.setAttribute("aria-atomic", "true");
			field.insertAdjacentElement("afterend", feedback);
			feedbackIds.set(field, feedback.id);

			field.addEventListener("input", () => showFieldFeedback(field));
			field.addEventListener("blur", () => showFieldFeedback(field));
		});

		function showFieldFeedback(field) {
			const feedback = document.getElementById(feedbackIds.get(field));
			if (!feedback) return;

			let message = "";
			if (field.validity.valueMissing) {
				message = "This field is required.";
			} else if (field.validity.typeMismatch && field.type === "email") {
				message = "Enter a valid email address.";
			} else if (!field.validity.valid) {
				message = field.validationMessage || "Please check this field.";
			}

			feedback.textContent = message;
			field.setAttribute("aria-invalid", String(Boolean(message)));
			const describedBy = (field.getAttribute("aria-describedby") || "")
				.split(/\s+/).filter(Boolean).filter((id) => id !== feedback.id);
			if (message) describedBy.push(feedback.id);
			if (describedBy.length) {
				field.setAttribute("aria-describedby", describedBy.join(" "));
			} else {
				field.removeAttribute("aria-describedby");
			}
		}

		contactForm.addEventListener("submit", (event) => {
			fields.forEach(showFieldFeedback);
			if (!contactForm.checkValidity()) {
				event.preventDefault();
				contactForm.reportValidity();
			}
		});
	}

	const hamburger = document.querySelector(".hamburger, #hamburger");
	if (hamburger) {
		hamburger.addEventListener("click", toggleMenu);
	}

	const filterControls = document.querySelectorAll(
		".project-filter, .filter-btn, [data-project-filter], [data-filter], button[data-category], a[data-category]"
	);
	filterControls.forEach((control) => {
		control.addEventListener("click", () => {
			const category = control.dataset.projectFilter || control.dataset.filter ||
				control.dataset.category || control.textContent;
			filterProjects(category);

			filterControls.forEach((filter) => {
				const isSelected = filter === control;
				filter.classList.toggle("active", isSelected);
				filter.setAttribute("aria-pressed", String(isSelected));
			});
		});
	});

	const navigation = document.querySelector(".navigation-menu, .nav-menu, #navigation-menu, #nav-menu");
	if (navigation) {
		navigation.querySelectorAll('a[href^="#"]').forEach((link) => {
			link.addEventListener("click", (event) => {
				const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
				if (target) {
					event.preventDefault();
					target.scrollIntoView({ behavior: "smooth" });
				}
			});
		});
	}
});

// Run the interaction checks by opening this page with ?test in the URL.
if (new URLSearchParams(location.search).has("test")) {
    document.addEventListener("DOMContentLoaded", () => {
        const results = [];
        const check = (name, passed) => results.push(`${passed ? "PASS" : "FAIL"} — ${name}`);
        const cards = [...document.querySelectorAll(".project-card")];
        const visibleCards = () => cards.filter((card) =>
        !card.hidden && getComputedStyle(card).display !== "none"
        );

        document.querySelectorAll('nav a[href^="#"]').forEach((link) => {
        link.click();
        check(`Navigate to ${link.textContent.trim()}`,
            !!document.querySelector(link.hash) && location.hash === link.hash);
        });

        for (const [category, expectedCount] of [["web", 2], ["app", 2], ["all", cards.length]]) {
        document.querySelector(`.project-filter[data-filter="${category}"]`).click();
        const shown = visibleCards();
        check(`${category} project filter`, shown.length === expectedCount &&
            (category === "all" || shown.every((card) => card.dataset.category === category)));
        }

        const form = document.querySelector("#contact-me form");
        const originalValues = [...form.elements].map((field) => field.value);
        form.elements.name.value = "Test Visitor";
        form.elements.email.value = "visitor@example.com";
        form.elements.message.value = "Automated contact form interaction test.";
        let submitted = false;
        form.addEventListener("submit", (event) => {
        event.preventDefault();
        submitted = true;
        }, { once: true });
        if (form.reportValidity()) form.requestSubmit();
        check("Valid contact form submission", submitted);
        [...form.elements].forEach((field, index) => { field.value = originalValues[index]; });

        const output = document.createElement("pre");
        output.setAttribute("role", "status");
        output.style.cssText = "position:fixed;right:1rem;bottom:1rem;z-index:9999;max-width:90vw;max-height:45vh;overflow:auto;padding:1rem;background:white;color:#111;border:1px solid #777";
        output.textContent = `Interaction test results\n${results.join("\n")}`;
        document.body.append(output);
        console.table(results);
    });
}