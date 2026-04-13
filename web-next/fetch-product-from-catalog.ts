async function run() {
  const res = await fetch("http://localhost:9000/admin/products?handle=horo-fiction-vibe");
  console.log(await res.json());
}
run();
