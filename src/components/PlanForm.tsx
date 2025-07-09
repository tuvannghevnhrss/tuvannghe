"use client";
import { useState, useEffect, FormEvent } from "react";
import { v4 as uuid } from "uuid";
import ProgressChart from "./ProgressChart";

interface Task {
  id: string;
  title: string;
  who: string;
  deadline: string;
  done: boolean;
  created_at: string;
}

type Filter = "all" | "pending" | "done";
type Sort   = "dateAsc" | "dateDesc";

export default function PlanForm({ goalId }: { goalId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form,  setForm ] = useState({ title:"", who:"", deadline:"" });
  const [filter,setFilter] = useState<Filter>("all");
  const [sort,  setSort  ] = useState<Sort>("dateAsc");

  /* tải danh sách */
  useEffect(()=>{
    fetch(`/api/career/action?goal=${goalId}`)
      .then(r=>r.json()).then(setTasks);
  },[goalId]);

  /* danh sách hiển thị */
  const show = tasks
    .filter(t => filter==="all" ? true : filter==="done"?t.done:!t.done)
    .sort((a,b)=>{
      const diff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return sort==="dateAsc" ? diff : -diff;
    });

  /* thêm việc */
  const add = async(e:FormEvent)=>{
    e.preventDefault();
    if(!form.title.trim()||!form.deadline) return;
    const t:Task={
      id:uuid(), title:form.title.trim(), who:form.who.trim(),
      deadline:form.deadline, done:false, created_at:new Date().toISOString()
    };
    setTasks(p=>[...p,t]);                          // optimistic
    setForm({title:"",who:"",deadline:""});
    await fetch("/api/career/action",
      {method:"POST",headers:{"Content-Type":"application/json"},
       body:JSON.stringify({...t, goal_id:goalId})});
  };

  /* tick hoàn thành */
  const toggle = async(id:string, done:boolean)=>{
    setTasks(p=>p.map(t=>t.id===id?{...t,done}:t));
    await fetch("/api/career/action",
      {method:"PATCH",headers:{"Content-Type":"application/json"},
       body:JSON.stringify({id,done})});
  };

  return (
    <section className="space-y-6">
      {/* Form nhập */}
      <form onSubmit={add} className="grid md:grid-cols-4 gap-2">
        <input className="rounded border p-2" placeholder="Việc cần làm"
               value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
        <input className="rounded border p-2" placeholder="Ai chịu trách nhiệm"
               value={form.who}   onChange={e=>setForm({...form,who:e.target.value})}/>
        <input required type="date" className="rounded border p-2"
               value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/>
        <button className="rounded bg-indigo-600 text-white px-4">Thêm</button>
      </form>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-4 text-sm">
        <label>Trạng thái&nbsp;
          <select value={filter} onChange={e=>setFilter(e.target.value as Filter)}
                  className="rounded border p-1">
            <option value="all">Tất cả</option>
            <option value="pending">Chưa xong</option>
            <option value="done">Đã xong</option>
          </select>
        </label>
        <label>Sắp xếp&nbsp;
          <select value={sort} onChange={e=>setSort(e.target.value as Sort)}
                  className="rounded border p-1">
            <option value="dateAsc">Ngày ↑</option>
            <option value="dateDesc">Ngày ↓</option>
          </select>
        </label>
      </div>

      {/* Danh sách */}
      <ul className="space-y-3">
        {show.map(t=>(
          <li key={t.id}
              className={`border-l-4 p-4 rounded shadow flex justify-between items-start ${
                t.done? "border-green-500 bg-green-50" : "border-gray-300 bg-white"
              }`}>
            <div>
              <p className="font-medium">{t.title}</p>
              <p className="text-xs text-gray-500">
                {t.who && <>({t.who}) · </>}
                Hạn: {new Date(t.deadline).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <input type="checkbox" checked={t.done}
                   onChange={e=>toggle(t.id,e.target.checked)}/>
          </li>
        ))}
      </ul>

      {tasks.length>0 && (
        <div className="mt-8">
          <h3 className="font-semibold mb-2">Lược đồ tiến độ</h3>
          <ProgressChart tasks={tasks}/>
        </div>
      )}
    </section>
  );
}
