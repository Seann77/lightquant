"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent
} from "react";
import { AtSign, Check, ChevronDown, MessageSquareText, Send, Tag, UserRound, X, type LucideIcon } from "lucide-react";
import {
  contactCategories,
  contactMethods,
  submitContactRequest,
  type ContactCategory,
  type ContactMethod
} from "@/lib/contact";

type ContactModalProps = {
  onClose: () => void;
  open: boolean;
};

type ContactFormState = {
  category: ContactCategory;
  contactMethod: ContactMethod;
  contactValue: string;
  message: string;
  name: string;
};

type ContactSelectId = "category" | "contactMethod";

const initialForm: ContactFormState = {
  category: "使用问题",
  contactMethod: "邮箱",
  contactValue: "",
  message: "",
  name: ""
};

export function ContactModal({ onClose, open }: ContactModalProps) {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [openSelect, setOpenSelect] = useState<ContactSelectId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!openSelect) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Element | null;

      if (!target?.closest(`[data-contact-select="${openSelect}"]`)) {
        setOpenSelect(null);
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenSelect(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openSelect]);

  if (!open) {
    return null;
  }

  function updateField<K extends keyof ContactFormState>(field: K) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value as ContactFormState[K]
      }));
      setSuccessMessage("");
      setErrorMessage("");
    };
  }

  function handleClose() {
    if (!submitting) {
      onClose();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const clientError = validateClientForm(form);

    if (clientError) {
      setErrorMessage(clientError);
      setSuccessMessage("");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await submitContactRequest({
        category: form.category,
        contactMethod: form.contactMethod,
        contactValue: form.contactValue.trim(),
        createdAt: new Date().toISOString(),
        message: form.message.trim(),
        name: form.name.trim(),
        source: window.location.pathname
      });

      setSuccessMessage(result.message);
      setForm(initialForm);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="lq-modal-backdrop" role="presentation">
      <section aria-labelledby="contact-modal-title" aria-modal="true" className="lq-modal lq-contact-modal" role="dialog">
        <button aria-label="关闭联系我们弹窗" className="lq-icon-button lq-modal-close" onClick={handleClose} type="button">
          <X aria-hidden="true" size={18} />
        </button>

        <div className="lq-modal-head lq-contact-modal-head">
          <Image
            alt="LightQuant LQ logo"
            className="lq-modal-logo"
            height={34}
            priority
            src="/lightquant/lightquant-app-icon.png"
            width={34}
          />
          <h2 className="lq-modal-title" id="contact-modal-title">
            联系我们
          </h2>
          <p className="lq-contact-subtitle">留下您的联系方式和问题描述，我们会尽快联系您。</p>
        </div>

        <form className="lq-form lq-contact-form" onSubmit={handleSubmit}>
          <div className="lq-contact-grid">
            <label className="lq-field-group" htmlFor="contact-name">
              <span className="lq-field-label">称呼</span>
              <span className="lq-field">
                <UserRound aria-hidden="true" size={16} />
                <input
                  autoComplete="name"
                  id="contact-name"
                  maxLength={80}
                  name="name"
                  onChange={updateField("name")}
                  placeholder="请输入您的称呼"
                  type="text"
                  value={form.name}
                />
              </span>
            </label>

            <ContactSelectField
              icon={AtSign}
              id="contact-method"
              label="联系方式类型"
              onOpenChange={(nextOpen) => setOpenSelect(nextOpen ? "contactMethod" : null)}
              onValueChange={(value) => {
                setForm((current) => ({ ...current, contactMethod: value }));
                setSuccessMessage("");
                setErrorMessage("");
              }}
              open={openSelect === "contactMethod"}
              options={contactMethods}
              selectId="contactMethod"
              value={form.contactMethod}
            />
          </div>

          <div className="lq-contact-grid">
            <label className="lq-field-group" htmlFor="contact-value">
              <span className="lq-field-label">号码</span>
              <span className="lq-field">
                <AtSign aria-hidden="true" size={16} />
                <input
                  autoComplete={form.contactMethod === "手机号" ? "tel" : form.contactMethod === "邮箱" ? "email" : "off"}
                  id="contact-value"
                  maxLength={120}
                  name="contactValue"
                  onChange={updateField("contactValue")}
                  placeholder={getContactValuePlaceholder(form.contactMethod)}
                  type={form.contactMethod === "手机号" ? "tel" : form.contactMethod === "邮箱" ? "email" : "text"}
                  value={form.contactValue}
                />
              </span>
            </label>

            <ContactSelectField
              icon={Tag}
              id="contact-category"
              label="问题类型"
              onOpenChange={(nextOpen) => setOpenSelect(nextOpen ? "category" : null)}
              onValueChange={(value) => {
                setForm((current) => ({ ...current, category: value }));
                setSuccessMessage("");
                setErrorMessage("");
              }}
              open={openSelect === "category"}
              options={contactCategories}
              selectId="category"
              value={form.category}
            />
          </div>

          <label className="lq-field-group" htmlFor="contact-message">
            <span className="lq-field-label">详细说明</span>
            <span className="lq-field lq-field-textarea">
              <MessageSquareText aria-hidden="true" size={16} />
              <textarea
                id="contact-message"
                maxLength={3000}
                name="message"
                onChange={updateField("message")}
                placeholder="请补充具体使用场景、问题现象或希望获得的帮助"
                value={form.message}
              />
            </span>
          </label>

          {successMessage ? <div className="lq-modal-message">{successMessage}</div> : null}
          {errorMessage ? <div className="lq-modal-error">{errorMessage}</div> : null}

          <div className="lq-contact-actions">
            <button className="lq-modal-secondary" disabled={submitting} onClick={handleClose} type="button">
              {successMessage ? "关闭" : "取消"}
            </button>
            <button className="lq-modal-primary" disabled={submitting} type="submit">
              <Send aria-hidden="true" size={17} />
              {submitting ? "提交中..." : "提交"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function validateClientForm(form: ContactFormState) {
  if (!form.name.trim()) {
    return "请填写称呼";
  }

  if (!form.contactMethod.trim()) {
    return "请选择联系方式类型";
  }

  if (!form.contactValue.trim()) {
    return "请填写号码";
  }

  if (!form.category.trim()) {
    return "请选择问题类型";
  }

  if (!form.message.trim()) {
    return "请填写详细说明";
  }

  return "";
}

function ContactSelectField<TValue extends string>({
  icon: Icon,
  id,
  label,
  onOpenChange,
  onValueChange,
  open,
  options,
  selectId,
  value
}: {
  icon: LucideIcon;
  id: string;
  label: string;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: TValue) => void;
  open: boolean;
  options: readonly TValue[];
  selectId: ContactSelectId;
  value: TValue;
}) {
  const activeOptionRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) {
      activeOptionRef.current?.focus();
    }
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      onOpenChange(true);
    }
  }

  return (
    <div className="lq-field-group lq-contact-select" data-contact-select={selectId}>
      <span className="lq-field-label" id={`${id}-label`}>
        {label}
      </span>
      <button
        aria-controls={`${id}-menu`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${id}-label`}
        className="lq-contact-select-trigger"
        data-testid={`${id}-trigger`}
        id={id}
        onClick={() => onOpenChange(!open)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <Icon aria-hidden="true" size={16} />
        <span className="lq-contact-select-value">{value}</span>
        <ChevronDown aria-hidden="true" className="lq-contact-select-caret" size={17} />
      </button>

      {open ? (
        <div aria-labelledby={`${id}-label`} className="lq-contact-select-menu" id={`${id}-menu`} role="listbox">
          {options.map((option) => {
            const selected = option === value;

            return (
              <button
                aria-selected={selected}
                className={`lq-contact-select-option ${selected ? "is-selected" : ""}`}
                key={option}
                onClick={() => {
                  onValueChange(option);
                  onOpenChange(false);
                }}
                ref={selected ? activeOptionRef : undefined}
                role="option"
                type="button"
              >
                <span>{option}</span>
                {selected ? <Check aria-hidden="true" size={15} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function getContactValuePlaceholder(method: ContactMethod) {
  if (method === "微信号") {
    return "请输入微信号";
  }

  if (method === "手机号") {
    return "请输入手机号";
  }

  return "请输入邮箱";
}
