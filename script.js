let espera=JSON.parse(localStorage.getItem("espera"))||[];
let historial=JSON.parse(localStorage.getItem("historial"))||[];
let turnoActual=JSON.parse(localStorage.getItem("turnoActual"))||1;

function registrar(){
  const nombre=document.getElementById("nombre").value.trim();
  const cantidad=parseInt(document.getElementById("cantidad").value);
  const tarjeta=document.getElementById("tarjeta").value;
  const mostrador=document.getElementById("mostrador").value;
  if(!nombre||!cantidad){alert("Completa los datos");return;}
  const horaRegistro=new Date().toISOString();
  const pasajero={turno:turnoActual++,nombre,cantidad,tarjeta,mostrador,estado:"Pendiente",horaRegistro,horaLlamada:null};
  espera.push(pasajero);
  localStorage.setItem("espera",JSON.stringify(espera));
  localStorage.setItem("turnoActual",turnoActual);
  document.getElementById("nombre").value="";
  document.getElementById("cantidad").value=1;
  render();
  imprimirTicketTermico(pasajero);
}

function abrirPantalla(){window.open("publico_avanzado.html","pantalla","fullscreen=yes");}

function render(){
  tabla.innerHTML="";
  espera.forEach((p,i)=>{
    tabla.innerHTML+=`
    <tr>
      <td>${p.turno}</td>
      <td>${p.nombre}</td>
      <td>${p.cantidad}</td>
      <td>${p.tarjeta}</td>
      <td>${p.mostrador}</td>
      <td>${new Date(p.horaRegistro).toLocaleTimeString()}</td>
      <td>${p.horaLlamada?p.horaLlamada.split('T')[1].slice(0,5):'---'}</td>
      <td>${p.estado}</td>
      <td>
        <button class="llamar" onclick="llamar(${i})">Llamar</button>
        <button class="finalizar" onclick="finalizar(${i})">Finalizar</button>
      </td>
    </tr>`;
  });

  document.getElementById("totalRegistros").innerText=espera.length;
  document.getElementById("totalPax").innerText=espera.reduce((a,b)=>a+b.cantidad,0);
  document.getElementById("countCenturion").innerText=espera.filter(p=>p.tarjeta==="Centurion").length;
  document.getElementById("countPlatino").innerText=espera.filter(p=>p.tarjeta==="Platino").length;
  document.getElementById("countAeromexico").innerText=espera.filter(p=>p.tarjeta==="Aeromexico").length;

  const tiempos=historial.filter(h=>h.horaRegistro && h.horaLlamada).map(h=> (new Date(h.horaLlamada)-new Date(h.horaRegistro))/60000 );
  document.getElementById("promedioEspera").innerText=tiempos.length? (tiempos.reduce((a,b)=>a+b,0)/tiempos.length).toFixed(1):0;
}

function llamar(i){ 
  const ahora=new Date().toISOString(); 
  espera[i].estado="Llamado"; 
  espera[i].horaLlamada=ahora; 
  localStorage.setItem("espera",JSON.stringify(espera)); 
  speechSynthesis.speak(new SpeechSynthesisUtterance(`Turno ${espera[i].turno}, mostrador ${espera[i].mostrador}`)); 
  render(); 
}

function finalizar(i){ 
  const p=espera.splice(i,1)[0]; 
  if(!p.horaLlamada)p.horaLlamada=new Date().toISOString(); 
  p.estado="Finalizado"; 
  historial.push(p); 
  localStorage.setItem("espera",JSON.stringify(espera)); 
  localStorage.setItem("historial",JSON.stringify(historial)); 
  render(); 
}

function borrarHistorial(){ 
  if(confirm("¿Deseas borrar todo el historial de turnos finalizados?")){ 
    historial=[]; 
    localStorage.setItem("historial",JSON.stringify(historial)); 
    localStorage.setItem("limpiarPublico","1"); 
    alert("Historial borrado correctamente"); 
  } 
}

function toggleDark(){document.body.classList.toggle("dark");}

function imprimirTicketTermico(p){ 
  const win=window.open("","_blank","width=300,height=400"); 
  win.document.write(`<pre style="font-family:monospace;font-size:14px;">
✈ AIRPORT WAITING
------------------------------
Turno: ${p.turno}
Nombre: ${p.nombre}
Pax: ${p.cantidad}
Tarjeta: ${p.tarjeta}
Mostrador: ${p.mostrador}
Fecha: ${new Date().toLocaleString()}
------------------------------
Gracias por su espera
</pre>`); 
  win.document.close(); win.focus(); win.print(); win.close(); 
}

function exportarExcel(){
  const wb=XLSX.utils.book_new();
  const hoy=new Date();
  const fechaStr=`${String(hoy.getDate()).padStart(2,'0')}-${String(hoy.getMonth()+1).padStart(2,'0')}-${hoy.getFullYear()}`;
  const datos=historial.map(p=>({
    Turno:p.turno,Nombre:p.nombre,Pax:p.cantidad,
    Tarjeta:p.tarjeta,Mostrador:p.mostrador,
    Hora_Registro:p.horaRegistro,Hora_Llamada:p.horaLlamada,
    Estado:p.estado
  }));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(datos),"Datos");

  const estadisticas=[];
  ["Centurion","Platino","Aeromexico"].forEach(t=>{
    const total=historial.filter(p=>p.tarjeta===t).length;
    const pax=historial.filter(p=>p.tarjeta===t).reduce((a,b)=>a+b.cantidad,0);
    estadisticas.push({Tarjeta:t,Total_Turnos:total,Total_Pax:pax});
  });
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(estadisticas),"Estadísticas");

  XLSX.writeFile(wb,`LISTA DE ESPERA - ${fechaStr}.xlsx`);
}

render();
