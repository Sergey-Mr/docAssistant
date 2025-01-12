<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Tab;

class EnsureDeafaultTab
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            Tab::firstOrCreate(
                ['user_id' => auth()->id()],
                ['name' => 'Default Tab']
            );
        }
        return $next($request);
    }
}
