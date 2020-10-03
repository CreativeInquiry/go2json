function fmtStringify(x,ind){
	if (!ind){
		ind = 0;
	}
	const MAXCOL = 80;

	let t = (typeof x);
	if (t == "number"){
		return x;
	}else if (t == "string"){
		return JSON.stringify(x)
	}else if (t == "boolean"){
		return ""+x;
	}else if (t != "object"){
		return "null"
	}
	if (Array.isArray(x)){
		if (!x.length){
			return "[]"
		}
		let q = [];
		let l = 0;
		for (var i = 0; i < x.length; i++){
			let s = JSON.stringify(x[i]);
			l = Math.max(s.length+2,l);
			q.push(s);
		}
		let ipl = (MAXCOL-ind-4)/l;
		if (ipl > 1){
			let o = "[";
			ipl = Math.floor(ipl);
			for (var i = 0; i < q.length; i++){
				if (i){
					o += ", "
				}
				if (i && i % ipl == 0){
					o += "\n ";
				}
				let p = " ".repeat(l-2-q[i].length);
				if (typeof x[i] == 'number'){
					o += p;
					o += q[i];
				}else{
					o += q[i];
					o += p
				}
			}
			let ln = o.split("\n")
			let l0 = ln[ln.length-1].length;
			let l1 = ln[Math.max(ln.length-2,0)].length;
			o += " ".repeat(Math.max(l1-l0-2,0));
			o += "]"
			return o.split("\n").map(y=>" ".repeat(ind)+y).join("\n");
		}else{
			let o = "[";
			for (var i = 0; i < x.length; i++){
				if (i){
					o += ",\n"
				}
				let s = fmtStringify(x[i],ind+1);
				o += i?s:s.trim();
			}
			o += "]";
			return o
		}
	}else{
		let q = JSON.stringify(x);
		if (q.length < MAXCOL-ind-2){
			return " ".repeat(ind)+q;
		}
		let o = "{";
		let kl = 0;
		for (var k in x){
			kl = Math.max(JSON.stringify(k).length,kl);
		}
		let fst = true;
		for (var k in x){
			if (!fst){
				o += ",\n "
			}
			let y = fmtStringify(x[k],kl+4);
			y = y.trim();
			let jk = JSON.stringify(k);
			o += `${jk}`+" ".repeat(kl-jk.length)+" : "+y;
			fst = false;
		}
		o += "}";
		return o.split("\n").map(y=>" ".repeat(ind)+y).join("\n");
	}
}