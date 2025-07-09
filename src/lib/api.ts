export async function saveKnowdell(data:any){
  const res=await fetch("/api/knowdell",{method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(data)});
  if(res.ok) window.location.href="/profile";
}
