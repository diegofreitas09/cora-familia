window.CORA_CONFIG={
  nome:'Colégio Cora Coralina',
  lema:'A escola ideal para o seu filho.',
  endereco:'R. 729, 360 - Conjunto Ceará I, Fortaleza - CE',
  telefone:'(85) 3294-0228',
  instagram:'@colegio_cora_coralina',
  instagramUrl:'https://www.instagram.com/colegio_cora_coralina/',
  whatsapp:'qr/AATF26IKRIIYL1',
  feedbackUrl:'https://script.google.com/macros/s/AKfycbyMmlJ8K-IssroQjySn7iKUJW6x3VyvsnL9ySFoWzLr12xwCnyC-oVPq30uxWWoPxCr/exec'
};

(function(){
  function corrigirFachada(){
    const img=document.querySelector('#historia .school-photo img, #historia figure img');
    if(!img)return false;
    const correto='./fachada-cora-familia.jpg?v=19';
    if(!img.src.includes('fachada-cora-familia.jpg') || !img.src.includes('v=19')) img.src=correto;
    img.onerror=function(){
      this.onerror=null;
      this.alt='Foto da fachada temporariamente indisponível';
      this.style.minHeight='260px';
      this.style.background='#dfeaf5';
    };
    return true;
  }
  document.addEventListener('DOMContentLoaded',()=>{
    corrigirFachada();
    setTimeout(corrigirFachada,200);
    setTimeout(corrigirFachada,800);
    setTimeout(corrigirFachada,1800);
  });
  window.addEventListener('load',corrigirFachada);
})();
