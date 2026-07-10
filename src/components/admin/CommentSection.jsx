export default function CommentSection({ form, set, candidate, user, inp }) {
  return (
    <div>
      <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Комментарий</label>
      <textarea
        className={inp + ' resize-y min-h-[100px]'}
        rows={4}
        value={form.comment}
        onChange={e => set('comment', e.target.value)}
        placeholder="Комментарий..."
        disabled={candidate && !user} />
      {candidate && user && <p className="text-xs text-[#F8FAFC]/30 mt-1">От: {user.role === 'super_admin' ? 'Супер-админ' : user.role === 'manager' ? 'Менеджер' : 'Администратор'}</p>}
    </div>
  );
}