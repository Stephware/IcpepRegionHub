"use client";

import { Alert, LoadingState } from "@/components/ui/feedback";
import { ListSearch } from "@/components/ui/list-search";
import { Pagination } from "@/components/ui/pagination";
import { useSearchPagination } from "@/lib/use-search-pagination";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createChapter,
  createChapterOfficer,
  getAdminChapter,
  listAdminChapterOfficers,
  listAdminChapters,
  setChapterOfficerCurrent,
  updateChapter,
  updateChapterOfficer,
  updateChapterStatus,
} from "./api";
import { chapterDisplayName } from "./display";
import type {
  AdminChapter,
  AdminChapterOfficer,
  ChapterInput,
  ChapterOfficerInput,
} from "./types";

const emptyChapterForm: ChapterInput = {
  schoolName: "",
  chapterName: "",
  acronym: "",
  officialEmail: "",
  contactNumber: "",
  address: "",
  logoUrl: "",
  facebookUrl: "",
};

const emptyOfficerForm: ChapterOfficerInput = {
  userId: "",
  fullName: "",
  position: "",
  email: "",
  contactNumber: "",
  photoUrl: "",
  academicYear: "",
};

export function ChapterAdminManager() {
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<AdminChapter | null>(
    null,
  );
  const [officers, setOfficers] = useState<AdminChapterOfficer[]>([]);
  const [chapterForm, setChapterForm] =
    useState<ChapterInput>(emptyChapterForm);
  const [officerForm, setOfficerForm] =
    useState<ChapterOfficerInput>(emptyOfficerForm);
  const [editingOfficerId, setEditingOfficerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [savingChapter, setSavingChapter] = useState(false);
  const [savingOfficer, setSavingOfficer] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const officerList = useSearchPagination(officers, (officer) =>
    [officer.fullName, officer.position, officer.academicYear, officer.email, officer.isCurrent ? "Current" : "Former"].join(" "),
    6,
  );
  const chapterList = useSearchPagination(chapters, (chapter) =>
    [
      chapter.chapterName,
      chapter.schoolName,
      chapter.acronym,
      chapter.officialEmail,
      chapter.address,
      chapter.status,
    ].join(" "),
  );

  const loadChapters = useCallback(async () => {
    const items = await listAdminChapters();
    setChapters(items);
    return items;
  }, []);

  useEffect(() => {
    let cancelled = false;

    listAdminChapters()
      .then((items) => {
        if (!cancelled) {
          setChapters(items);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load chapters.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function showError(requestError: unknown, fallback: string) {
    setError(requestError instanceof Error ? requestError.message : fallback);
    setNotice("");
  }

  function startCreateChapter() {
    setSelectedChapter(null);
    setChapterForm(emptyChapterForm);
    setOfficers([]);
    officerList.setQuery("");
    setEditingOfficerId(null);
    setOfficerForm(emptyOfficerForm);
    setError("");
    setNotice("");
  }

  async function selectChapter(chapterId: string) {
    setDetailsLoading(true);
    setError("");
    setNotice("");

    try {
      const [chapter, chapterOfficers] = await Promise.all([
        getAdminChapter(chapterId),
        listAdminChapterOfficers(chapterId),
      ]);
      setSelectedChapter(chapter);
      setChapterForm({
        schoolName: chapter.schoolName,
        chapterName: chapter.chapterName,
        acronym: chapter.acronym ?? "",
        officialEmail: chapter.officialEmail ?? "",
        contactNumber: chapter.contactNumber ?? "",
        address: chapter.address ?? "",
        logoUrl: chapter.logoUrl ?? "",
        facebookUrl: chapter.facebookUrl ?? "",
      });
      setOfficers(chapterOfficers);
      officerList.setQuery("");
      setEditingOfficerId(null);
      setOfficerForm(emptyOfficerForm);
    } catch (requestError) {
      showError(requestError, "Unable to load chapter details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  function updateChapterField(field: keyof ChapterInput, value: string) {
    setChapterForm((current) => ({ ...current, [field]: value }));
  }

  function updateOfficerField(field: keyof ChapterOfficerInput, value: string) {
    setOfficerForm((current) => ({ ...current, [field]: value }));
  }

  async function handleChapterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingChapter(true);
    setError("");
    setNotice("");

    try {
      const result = selectedChapter
        ? await updateChapter(selectedChapter.chapterId, chapterForm)
        : await createChapter(chapterForm);

      setNotice(result.message);
      await loadChapters();
      await selectChapter(result.chapter.chapterId);
    } catch (requestError) {
      showError(requestError, "Unable to save chapter.");
    } finally {
      setSavingChapter(false);
    }
  }

  async function handleStatusChange() {
    if (!selectedChapter) {
      return;
    }

    const nextStatus =
      selectedChapter.status === "Active" ? "Inactive" : "Active";

    setError("");
    setNotice("");

    try {
      const result = await updateChapterStatus(
        selectedChapter.chapterId,
        nextStatus,
      );
      setSelectedChapter(result.chapter);
      setNotice(result.message);
      await loadChapters();
    } catch (requestError) {
      showError(requestError, "Unable to update chapter status.");
    }
  }

  function startOfficerEdit(officer: AdminChapterOfficer) {
    setEditingOfficerId(officer.chapterOfficerId);
    setOfficerForm({
      userId: officer.userId ?? "",
      fullName: officer.fullName,
      position: officer.position,
      email: officer.email ?? "",
      contactNumber: officer.contactNumber ?? "",
      photoUrl: officer.photoUrl ?? "",
      academicYear: officer.academicYear,
    });
    setError("");
    setNotice("");
  }

  function cancelOfficerEdit() {
    setEditingOfficerId(null);
    setOfficerForm(emptyOfficerForm);
  }

  async function refreshOfficers(chapterId: string) {
    const chapterOfficers = await listAdminChapterOfficers(chapterId);
    setOfficers(chapterOfficers);
  }

  async function handleOfficerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedChapter) {
      return;
    }

    setSavingOfficer(true);
    setError("");
    setNotice("");

    try {
      const result = editingOfficerId
        ? await updateChapterOfficer(
            selectedChapter.chapterId,
            editingOfficerId,
            officerForm,
          )
        : await createChapterOfficer(selectedChapter.chapterId, officerForm);

      setNotice(result.message);
      setEditingOfficerId(null);
      setOfficerForm(emptyOfficerForm);
      await refreshOfficers(selectedChapter.chapterId);
    } catch (requestError) {
      showError(requestError, "Unable to save chapter officer.");
    } finally {
      setSavingOfficer(false);
    }
  }

  async function toggleOfficerCurrent(officer: AdminChapterOfficer) {
    if (!selectedChapter) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const result = await setChapterOfficerCurrent(
        selectedChapter.chapterId,
        officer.chapterOfficerId,
        !officer.isCurrent,
      );
      setNotice(result.message);
      await refreshOfficers(selectedChapter.chapterId);
    } catch (requestError) {
      showError(requestError, "Unable to update officer status.");
    }
  }

  if (loading) {
    return <LoadingState label="Loading chapters..." />;
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white"
          onClick={startCreateChapter}
          type="button"
        >
          Add chapter
        </button>

        <div className="mt-4">
          <ListSearch
            label="Search chapters"
            onQueryChange={chapterList.setQuery}
            placeholder="Chapter, school, email, or status"
            query={chapterList.query}
            total={chapterList.total}
          />
        </div>
        <div className="mt-4 space-y-2">
          {chapterList.items.length ? (
            chapterList.items.map((chapter) => (
              <button
                className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                  selectedChapter?.chapterId === chapter.chapterId
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
                key={chapter.chapterId}
                onClick={() => void selectChapter(chapter.chapterId)}
                type="button"
              >
                <span className="block text-sm font-medium text-slate-950">
                  {chapterDisplayName(chapter)}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {chapter.schoolName}
                </span>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    chapter.status === "Active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {chapter.status}
                </span>
              </button>
            ))
          ) : (
            <p className="py-4 text-sm text-slate-500">
              {chapters.length
                ? "No chapters match your search."
                : "No chapters have been created yet."}
            </p>
          )}
        </div>
        <Pagination
          label="Chapter management pages"
          onPageChange={chapterList.setPage}
          page={chapterList.page}
          pageCount={chapterList.pageCount}
        />
      </aside>

      <div className="space-y-6">
        {error ? <Alert tone="error">{error}</Alert> : null}
        {notice ? <Alert tone="success">{notice}</Alert> : null}

        {detailsLoading ? (
          <LoadingState label="Loading chapter details..." />
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  {selectedChapter ? "Edit chapter" : "Create chapter"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedChapter
                    ? "Update this chapter's public directory information."
                    : "Add a new chapter to the Region 3 directory."}
                </p>
              </div>

              {selectedChapter ? (
                <button
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                  onClick={() => void handleStatusChange()}
                  type="button"
                >
                  {selectedChapter.status === "Active"
                    ? "Deactivate chapter"
                    : "Activate chapter"}
                </button>
              ) : null}
            </div>

            <form
              className="mt-6 grid gap-5 sm:grid-cols-2"
              onSubmit={handleChapterSubmit}
            >
              <Field
                label="School name"
                onChange={(value) => updateChapterField("schoolName", value)}
                required
                value={chapterForm.schoolName}
              />
              <Field
                label="Chapter name"
                onChange={(value) => updateChapterField("chapterName", value)}
                required
                value={chapterForm.chapterName}
              />
              <Field
                label="Acronym"
                onChange={(value) => updateChapterField("acronym", value)}
                value={chapterForm.acronym ?? ""}
              />
              <Field
                label="Official email"
                onChange={(value) => updateChapterField("officialEmail", value)}
                type="email"
                value={chapterForm.officialEmail ?? ""}
              />
              <Field
                label="Contact number"
                onChange={(value) => updateChapterField("contactNumber", value)}
                value={chapterForm.contactNumber ?? ""}
              />
              <Field
                label="Address"
                onChange={(value) => updateChapterField("address", value)}
                value={chapterForm.address ?? ""}
              />
              <Field
                label="Logo URL"
                onChange={(value) => updateChapterField("logoUrl", value)}
                value={chapterForm.logoUrl ?? ""}
              />
              <Field
                label="Facebook URL"
                onChange={(value) => updateChapterField("facebookUrl", value)}
                value={chapterForm.facebookUrl ?? ""}
              />

              <div className="sm:col-span-2">
                <button
                  className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                  disabled={savingChapter}
                  type="submit"
                >
                  {savingChapter
                    ? "Saving..."
                    : selectedChapter
                      ? "Save chapter"
                      : "Create chapter"}
                </button>
              </div>
            </form>
          </section>
        )}

        {selectedChapter && !detailsLoading ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Chapter officers
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Maintain current and former officer records for this chapter.
              </p>
            </div>

            {officers.length > 6 || officerList.query ? (
              <ListSearch
                label="Search chapter officers"
                placeholder="Name, position, academic year, or status"
                query={officerList.query}
                onQueryChange={officerList.setQuery}
                total={officerList.total}
              />
            ) : null}
            {officerList.total ? (
              <div className="mt-5 space-y-3">
                {officerList.items.map((officer) => (
                  <div
                    className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center"
                    key={officer.chapterOfficerId}
                  >
                    <div>
                      <p className="font-medium text-slate-950">
                        {officer.fullName}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {officer.position} · AY {officer.academicYear}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {officer.isCurrent
                          ? "Current officer"
                          : "Former officer"}
                        {officer.userId
                          ? ` · Linked user #${officer.userId}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                        onClick={() => startOfficerEdit(officer)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                        onClick={() => void toggleOfficerCurrent(officer)}
                        type="button"
                      >
                        Mark {officer.isCurrent ? "former" : "current"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-600">
                {officers.length ? "No officer records match your search." : "No officer records have been added for this chapter."}
              </p>
            )}

            <Pagination label="Chapter officer records" page={officerList.page} pageCount={officerList.pageCount} onPageChange={officerList.setPage} />

            <form
              className="mt-6 grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2"
              onSubmit={handleOfficerSubmit}
            >
              <div className="sm:col-span-2">
                <h3 className="font-semibold text-slate-950">
                  {editingOfficerId ? "Edit officer" : "Add officer"}
                </h3>
              </div>
              <Field
                label="Full name"
                onChange={(value) => updateOfficerField("fullName", value)}
                required
                value={officerForm.fullName}
              />
              <Field
                label="Position"
                onChange={(value) => updateOfficerField("position", value)}
                required
                value={officerForm.position}
              />
              <Field
                label="Academic year"
                onChange={(value) => updateOfficerField("academicYear", value)}
                placeholder="2026-2027"
                required
                value={officerForm.academicYear}
              />
              <Field
                label="Linked user ID"
                onChange={(value) => updateOfficerField("userId", value)}
                value={officerForm.userId ?? ""}
              />
              <Field
                label="Email"
                onChange={(value) => updateOfficerField("email", value)}
                type="email"
                value={officerForm.email ?? ""}
              />
              <Field
                label="Contact number"
                onChange={(value) => updateOfficerField("contactNumber", value)}
                value={officerForm.contactNumber ?? ""}
              />

              <Field
                label="Photo URL or /assets/people/ image path"
                onChange={(value) => updateOfficerField("photoUrl", value)}
                placeholder="/assets/people/officer.jpg"
                maxLength={500}
                value={officerForm.photoUrl ?? ""}
              />

              <div className="flex gap-2 sm:col-span-2">
                <button
                  className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                  disabled={savingOfficer}
                  type="submit"
                >
                  {savingOfficer
                    ? "Saving..."
                    : editingOfficerId
                      ? "Save officer"
                      : "Add officer"}
                </button>
                {editingOfficerId ? (
                  <button
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
                    onClick={cancelOfficerEdit}
                    type="button"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange(value: string): void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  maxLength,
}: FieldProps) {
  return (
    <label className="text-sm font-medium text-slate-800">
      {label}
      <input
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-700"
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}
