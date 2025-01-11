<div 
    x-data="{ show: false, message: '', type: '' }" 
    x-show="show" 
    x-transition
    x-cloak
    :class="type === 'success' ? 'bg-green-100 border border-green-200 text-green-800' : 'bg-red-100 border border-red-200 text-red-800'"
    class="p-4 rounded-lg mx-6 mb-4"
>
    <p x-text="message" class="text-sm font-medium"></p>
</div>